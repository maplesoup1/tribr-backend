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

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Update Geo Location
    await this.prisma.$executeRaw`
      UPDATE activities
      SET location = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)::geography
      WHERE id = ${activity.id}
    `;

    return this.findOne(userId, activity.id);
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
        a.privacy,
        a."womenOnly",
        a."ageMin",
        a."ageMax",
        a."createdAt",
        p."fullName" as "creatorName",
        p."avatarUrl" as "creatorAvatar",
        ST_DistanceSphere(
          a.location::geometry,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geometry
        ) as distance,
        (
            SELECT count(*) 
            FROM activity_participants ap 
            WHERE ap."activityId" = a.id AND ap.status = 'joined'
        )::int as "participantsCount",
        EXISTS (
            SELECT 1 
            FROM activity_participants ap 
            WHERE ap."activityId" = a.id AND ap."userId" = ${userId}
        ) as "isJoined"
      FROM activities a
      JOIN users u ON a."creatorId" = u.id
      LEFT JOIN profiles p ON p."userId" = u.id
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
    return results.map(r => ({
        ...r,
        // Handle boolean conversion from raw query if necessary (Postgres usually returns bools correctly to Prisma)
    }));
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

    return {
        ...activity,
        participantsCount,
        isJoined: !!userParticipant,
        myStatus: userParticipant?.status,
        myRole: userParticipant?.role,
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
        // Very basic check - real world might need stricter verification
        const gender = user.profile?.gender?.toLowerCase();
        if (gender !== 'female' && gender !== 'woman') {
            throw new ForbiddenException('This activity is for women only');
        }
    }

    // 2. Age Check (Approximate)
    if (user.profile?.birthDate) {
        const age = new Date().getFullYear() - user.profile.birthDate.getFullYear();
        if (age < activity.ageMin || age > activity.ageMax) {
            throw new ForbiddenException(`Activity is restricted to ages ${activity.ageMin}-${activity.ageMax}`);
        }
    }

    // Determine status
    const status = activity.privacy === ActivityPrivacy.open 
        ? ActivityParticipantStatus.joined 
        : ActivityParticipantStatus.pending;

    try {
        return await this.prisma.activityParticipant.create({
            data: {
                activityId,
                userId,
                role: ActivityParticipantRole.guest,
                status
            }
        });
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
}
