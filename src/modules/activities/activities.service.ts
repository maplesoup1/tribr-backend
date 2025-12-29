import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import {
  ActivityPrivacy,
  ActivityStatus,
  ActivityParticipantStatus,
  ActivityParticipantRole,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Calculate exact age from birth date, accounting for month and day
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // If birthday hasn't occurred this year, subtract 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  async create(userId: string, dto: CreateActivityDto) {
    // 1. Validate age range (defensive defaults)
    const ageMin = dto.ageMin ?? 0;
    const ageMax = dto.ageMax ?? 150;
    if (ageMin > ageMax) {
      throw new BadRequestException('Age min cannot be greater than age max');
    }

    // 2. Prepare specificTime Date object
    let specificTimeDate: Date | null = null;
    if (dto.specificTime) {
      // Assuming dto.specificTime is an ISO string or time string
      // We store it as a DateTime object, usually combining with the date or just storing the time component depending on DB
      // Prisma DateTime maps to PostgreSQL timestamp/timestamptz.
      // If schema uses @db.Time, it might expect a Date object where only time matters.
      specificTimeDate = new Date(`1970-01-01T${dto.specificTime}`);
      if (isNaN(specificTimeDate.getTime())) {
          // Try parsing as full ISO
          specificTimeDate = new Date(dto.specificTime);
      }
      // Final validation: ensure we have a valid date
      if (isNaN(specificTimeDate.getTime())) {
        throw new BadRequestException(`Invalid time format: ${dto.specificTime}. Expected HH:MM or ISO format.`);
      }
    }

    // 3. Create Activity with Transaction to ensure PostGIS data and Creator Participant
    // Note: Prisma does not support PostGIS writes directly in 'create' easily without raw query for the 'location' field if it is Unsupported type.
    // However, since we defined 'location' as Unsupported("geography..."), we must use $executeRaw or separate update.
    // Strategy: Create record first, then update location with raw SQL, then add participant.

    const activity = await this.prisma.activity.create({
      data: {
        creatorId: userId,
        emoji: dto.emoji,
        description: dto.description,
        date: new Date(dto.date),
        timeType: dto.timeType,
        specificTime: specificTimeDate,
        locationText: dto.locationText,
        privacy: dto.privacy,
        womenOnly: dto.womenOnly ?? false,
        ageMin,
        ageMax,
        status: ActivityStatus.active,
        // location field is skipped here, updated below
      },
    });

    // Run independent operations in parallel
    const [_, __, conversation] = await Promise.all([
      // 1. Update Geo Location
      this.prisma.$executeRaw`
        UPDATE activities
        SET location = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)::geography
        WHERE id = ${activity.id}
      `,

      // 2. Ensure creator is recorded as host participant
      this.prisma.activityParticipant.create({
        data: {
          activityId: activity.id,
          userId,
          role: ActivityParticipantRole.host,
          status: ActivityParticipantStatus.joined,
        },
      }).catch((err: any) => {
        if (err?.code !== 'P2002') {
          throw err;
        }
      }),

      // 3. Create group conversation tied to this activity
      this.chatService.createConversation(
        userId,
        [],
        'group',
        dto.description || 'Activity Chat',
        {
          activityId: activity.id,
          activityTitle: dto.description,
          activityEmoji: dto.emoji,
          activityLocation: dto.locationText,
        },
      )
    ]);

    const activityWithDetails = await this.findOne(userId, activity.id);
    return {
      ...activityWithDetails,
      conversationId: conversation.id,
    };
  }

  async findAll(userId: string, query: ActivityQueryDto) {
    const { latitude, longitude, radiusKm, date, limit, offset } = query;
    const radiusMeters = (radiusKm || 50) * 1000;

    // We use $queryRaw to perform efficient PostGIS filtering
    // And we need to manually map the results
    
    // Privacy Logic:
    // 1. Open activities are visible to everyone
    // 2. Private activities are visible ONLY if user is a participant (joined/pending) or creator
    
    // Note: Date filtering. If date is provided, filter by exact date.
    const dateCondition = date
      ? Prisma.sql`AND a.date = ${new Date(date)}::date`
      : Prisma.sql``;

    const results = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT 
        a.id,
        a.emoji,
        a.description,
        a.date,
        a."timeType",
        a."specificTime",
        a."locationText",
        ST_Y(a.location::geometry) as latitude,
        ST_X(a.location::geometry) as longitude,
        a.privacy,
        a."womenOnly",
        a."ageMin",
        a."ageMax",
        a."createdAt",
        a."creatorId",
        p."fullName" as "creatorName",
        p."avatarUrl" as "creatorAvatar",
        c.id as "conversationId",
        ST_DistanceSphere(
          a.location::geometry,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geometry
        ) as distance,
        (
            SELECT count(*) 
            FROM activity_participants ap 
            WHERE ap."activityId" = a.id AND ap.status = 'joined'
        )::int as "participantCount",
        EXISTS (
            SELECT 1 
            FROM activity_participants ap 
            WHERE ap."activityId" = a.id AND ap."userId" = ${userId}
        ) as "isJoined"
      FROM activities a
      JOIN users u ON a."creatorId" = u.id
      LEFT JOIN profiles p ON p."userId" = u.id
      LEFT JOIN conversations c ON c.metadata->>'activityId' = a.id::text
      WHERE 
        a.status = 'active'
        ${dateCondition}
        AND ST_DWithin(
          a.location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
        AND (
          a.privacy = 'open' 
          OR (
            a.privacy = 'private' 
            AND EXISTS (
                SELECT 1 FROM activity_participants ap 
                WHERE ap."activityId" = a.id AND ap."userId" = ${userId}
            )
          )
      )
      ORDER BY distance ASC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // Parse specificTime if needed or other transformations
    return results.map((r) => {
      // Convert distance from meters to kilometers for consistency with usersApi
      const distanceMeters = r.distance !== undefined ? Number(r.distance) : null;
      const distanceKm = distanceMeters !== null ? Math.round((distanceMeters / 1000) * 10) / 10 : null;

      return {
        ...r,
        latitude: r.latitude !== undefined ? Number(r.latitude) : r.latitude,
        longitude: r.longitude !== undefined ? Number(r.longitude) : r.longitude,
        distance: distanceKm, // Now in kilometers (number)
        distanceKm, // Explicit km field for clarity
        participantCount: r.participantCount ?? 0,
        creator: {
          id: r.creatorId,
          name: r.creatorName || 'Unknown',
          avatar: r.creatorAvatar,
        },
      };
    });
  }

  async findOne(userId: string, activityId: string) {
    // Fetch activity with standard Prisma relation query first
    // But we need to check privacy logic
    const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        include: {
            creator: {
                include: { profile: true }
            },
            participants: {
                take: 5,
                where: { status: ActivityParticipantStatus.joined },
                include: {
                    user: {
                        include: { profile: true }
                    }
                },
                orderBy: { joinedAt: 'asc' }
            }
        }
    });

    if (!activity) {
        throw new NotFoundException('Activity not found');
    }

    const [coords] = await this.prisma.$queryRaw<{ latitude: number; longitude: number }[]>`
      SELECT 
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude
      FROM activities
      WHERE id = ${activityId}
    `;

    const userParticipant = await this.prisma.activityParticipant.findUnique({
        where: {
            activityId_userId: {
                activityId,
                userId
            }
        }
    });

    // Privacy Check
    if (activity.privacy === ActivityPrivacy.private) {
        if (!userParticipant && activity.creatorId !== userId) {
            throw new ForbiddenException('This is a private activity');
        }
    }

    // Get total count
    const participantsCount = await this.prisma.activityParticipant.count({
        where: {
            activityId,
            status: ActivityParticipantStatus.joined
        }
    });

    // Find associated conversation
    const conversation = await this.prisma.conversation.findFirst({
        where: {
            metadata: {
                path: ['activityId'],
                equals: activityId,
            },
        },
        select: { id: true },
    });

    return {
        ...activity,
        participantsCount,
        conversationId: conversation?.id,
        isJoined: !!userParticipant,
        myStatus: userParticipant?.status,
        myRole: userParticipant?.role,
        latitude:
          coords?.latitude !== undefined ? Number(coords.latitude) : coords?.latitude,
        longitude:
          coords?.longitude !== undefined ? Number(coords.longitude) : coords?.longitude,
        creator: {
            id: activity.creator.id,
            name: activity.creator.profile?.fullName || 'User',
            avatarUrl: activity.creator.profile?.avatarUrl
        },
        participants: activity.participants.map(p => ({
            userId: p.userId,
            name: p.user.profile?.fullName,
            avatarUrl: p.user.profile?.avatarUrl
        }))
    };
  }

  async join(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findUnique({
        where: { id: activityId }
    });

    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.status !== ActivityStatus.active) throw new BadRequestException('Activity is no longer active');

    // Check Eligibility
    const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    // 1. Women Only Check
    if (activity.womenOnly) {
      const userProfile = await this.prisma.profile.findUnique({
        where: { userId },
      });
      
      const allowedGenders = ['female', 'woman', 'non-binary', 'nonbinary'];
      const userGender = userProfile?.gender?.toLowerCase() || '';

      if (!allowedGenders.includes(userGender)) {
        throw new ForbiddenException(
          'This activity is restricted to women and non-binary travelers',
        );
      }
    }

    // 2. Age Check (Precise calculation)
    if (user.profile?.birthDate) {
        const age = this.calculateAge(user.profile.birthDate);
        if (age < activity.ageMin || age > activity.ageMax) {
            throw new ForbiddenException(`Activity is restricted to ages ${activity.ageMin}-${activity.ageMax}`);
        }
    }

    // Determine status
    const status = activity.privacy === ActivityPrivacy.open 
        ? ActivityParticipantStatus.joined 
        : ActivityParticipantStatus.pending;

    try {
        const participant = await this.prisma.activityParticipant.create({
            data: {
                activityId,
                userId,
                role: ActivityParticipantRole.guest,
                status
            }
        });

        // Add to activity conversation when auto-joined (open activities)
        let conversationId: string | undefined;
        if (status === ActivityParticipantStatus.joined) {
            let conversation = await this.prisma.conversation.findFirst({
              where: {
                metadata: {
                  path: ['activityId'],
                  equals: activityId,
                },
              },
            });

            if (!conversation) {
              conversation = await this.chatService.createConversation(
                activity.creatorId,
                [],
                'group',
                activity.description || 'Activity Chat',
                {
                  activityId: activity.id,
                  activityTitle: activity.description,
                  activityEmoji: activity.emoji,
                  activityLocation: activity.locationText,
                },
              );
            }

            conversationId = conversation.id;

            await this.prisma.conversationParticipant.create({
              data: {
                conversationId,
                userId,
                role: 'member',
              },
            }).catch((err: any) => {
              if (err?.code !== 'P2002') {
                throw err;
              }
            });
        }

        // Send notification to activity creator for private activities (join request)
        if (status === ActivityParticipantStatus.pending) {
            const requesterProfile = await this.prisma.profile.findUnique({
                where: { userId }
            });

            await this.notificationsService.notifyActivityJoinRequest(
                activity.creatorId,
                {
                    id: userId,
                    name: requesterProfile?.fullName || 'Someone',
                    avatar: requesterProfile?.avatarUrl ?? undefined,
                },
                {
                    id: activityId,
                    description: activity.description ?? undefined,
                    emoji: activity.emoji ?? undefined,
                }
            );
        }

        return {
          ...participant,
          conversationId,
          activityTitle: activity.description,
        };
    } catch (e) {
        if (e.code === 'P2002') {
            throw new BadRequestException('You have already requested to join this activity');
        }
        throw e;
    }
  }

  async leave(userId: string, activityId: string) {
    const participant = await this.prisma.activityParticipant.findUnique({
        where: { activityId_userId: { activityId, userId } }
    });

    if (!participant) throw new NotFoundException('You are not a participant');
    
    if (participant.role === ActivityParticipantRole.host) {
        throw new BadRequestException('Hosts cannot leave their own activity. Close it instead.');
    }

    return this.prisma.activityParticipant.delete({
        where: { activityId_userId: { activityId, userId } }
    });
  }
  
  async getParticipants(userId: string, activityId: string) {
      // Ensure user has access (basic check)
      await this.findOne(userId, activityId); 
      
      return this.prisma.activityParticipant.findMany({
          where: { activityId },
          include: {
              user: {
                  include: { profile: true }
              }
          },
          orderBy: { joinedAt: 'asc' }
      });
  }

  /**
   * Approve a pending participant (host only)
   */
  async approveParticipant(hostUserId: string, activityId: string, participantUserId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) throw new NotFoundException('Activity not found');

    // Only host/creator can approve
    if (activity.creatorId !== hostUserId) {
      throw new ForbiddenException('Only the activity host can approve participants');
    }

    const participant = await this.prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId, userId: participantUserId } },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.status !== ActivityParticipantStatus.pending) {
      throw new BadRequestException('Participant is not in pending status');
    }

    // Update status to joined
    const updated = await this.prisma.activityParticipant.update({
      where: { activityId_userId: { activityId, userId: participantUserId } },
      data: { status: ActivityParticipantStatus.joined },
    });

    // Add to conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        metadata: {
          path: ['activityId'],
          equals: activityId,
        },
      },
    });

    if (!conversation) {
      conversation = await this.chatService.createConversation(
        activity.creatorId,
        [],
        'group',
        activity.description || 'Activity Chat',
        {
          activityId: activity.id,
          activityTitle: activity.description,
          activityEmoji: activity.emoji,
          activityLocation: activity.locationText,
        },
      );
    }

    await this.prisma.conversationParticipant.create({
      data: {
        conversationId: conversation.id,
        userId: participantUserId,
        role: 'member',
      },
    }).catch((err: any) => {
      if (err?.code !== 'P2002') throw err;
    });

    // Notify the user they were approved
    const hostProfile = await this.prisma.profile.findUnique({
      where: { userId: hostUserId },
    });

    await this.notificationsService.create({
      userId: participantUserId,
      type: 'activity_request_approved',
      title: 'Request Approved',
      body: `${hostProfile?.fullName || 'The host'} approved your request to join "${activity.description}"`,
      data: {
        activityId,
        conversationId: conversation.id,
      },
    });

    return { ...updated, conversationId: conversation.id };
  }

  /**
   * Reject a pending participant (host only)
   */
  async rejectParticipant(hostUserId: string, activityId: string, participantUserId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) throw new NotFoundException('Activity not found');

    // Only host/creator can reject
    if (activity.creatorId !== hostUserId) {
      throw new ForbiddenException('Only the activity host can reject participants');
    }

    const participant = await this.prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId, userId: participantUserId } },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.status !== ActivityParticipantStatus.pending) {
      throw new BadRequestException('Participant is not in pending status');
    }

    // Delete the participant record
    await this.prisma.activityParticipant.delete({
      where: { activityId_userId: { activityId, userId: participantUserId } },
    });

    // Notify the user they were rejected
    await this.notificationsService.create({
      userId: participantUserId,
      type: 'activity_request_declined',
      title: 'Request Declined',
      body: `Your request to join "${activity.description}" was declined`,
      data: { activityId },
    });

    return { message: 'Participant rejected' };
  }

  /**
   * Get pending participants for an activity (host only)
   */
  async getPendingParticipants(hostUserId: string, activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) throw new NotFoundException('Activity not found');

    // Only host/creator can see pending
    if (activity.creatorId !== hostUserId) {
      throw new ForbiddenException('Only the activity host can view pending participants');
    }

    return this.prisma.activityParticipant.findMany({
      where: {
        activityId,
        status: ActivityParticipantStatus.pending,
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async getFeed(userId: string) {
    // 1. New Activities (last 5)
    const newActivities = await this.prisma.activity.findMany({
      where: {
        status: 'active',
        privacy: 'open',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        creator: { include: { profile: true } },
      },
    });

    // 2. Map to feed items
    const activityItems = newActivities.map((a) => ({
      id: a.id,
      type: 'activity_created',
      user: {
        name: a.creator.profile?.fullName || 'Someone',
        avatar: a.creator.profile?.avatarUrl,
      },
      action: `posted a new activity: ${a.emoji || '📅'} ${a.description}`,
      time: a.createdAt,
      metadata: { activityId: a.id },
    }));

    return activityItems.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  }
}
