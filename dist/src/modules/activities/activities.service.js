"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
const chat_service_1 = require("../chat/chat.service");
let ActivitiesService = class ActivitiesService {
    prisma;
    notificationsService;
    chatService;
    constructor(prisma, notificationsService, chatService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.chatService = chatService;
    }
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }
    async create(userId, dto) {
        const ageMin = dto.ageMin ?? 0;
        const ageMax = dto.ageMax ?? 150;
        if (ageMin > ageMax) {
            throw new common_1.BadRequestException('Age min cannot be greater than age max');
        }
        let specificTimeDate = null;
        if (dto.specificTime) {
            specificTimeDate = new Date(`1970-01-01T${dto.specificTime}`);
            if (isNaN(specificTimeDate.getTime())) {
                specificTimeDate = new Date(dto.specificTime);
            }
        }
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
                status: client_2.ActivityStatus.active,
            },
        });
        await this.prisma.$executeRaw `
      UPDATE activities
      SET location = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)::geography
      WHERE id = ${activity.id}
    `;
        await this.prisma.activityParticipant.create({
            data: {
                activityId: activity.id,
                userId,
                role: client_2.ActivityParticipantRole.host,
                status: client_2.ActivityParticipantStatus.joined,
            },
        }).catch((err) => {
            if (err?.code !== 'P2002') {
                throw err;
            }
        });
        const conversation = await this.chatService.createConversation(userId, [], 'group', dto.description || 'Activity Chat', {
            activityId: activity.id,
            activityTitle: dto.description,
            activityEmoji: dto.emoji,
            activityLocation: dto.locationText,
        });
        const activityWithDetails = await this.findOne(userId, activity.id);
        return {
            ...activityWithDetails,
            conversationId: conversation.id,
        };
    }
    async findAll(userId, query) {
        const { latitude, longitude, radiusKm, date, limit, offset } = query;
        const radiusMeters = (radiusKm || 50) * 1000;
        const dateCondition = date
            ? client_1.Prisma.sql `AND a.date = ${new Date(date)}::date`
            : client_1.Prisma.sql ``;
        const results = await this.prisma.$queryRaw(client_1.Prisma.sql `
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
        return results.map((r) => ({
            ...r,
            latitude: r.latitude !== undefined ? Number(r.latitude) : r.latitude,
            longitude: r.longitude !== undefined ? Number(r.longitude) : r.longitude,
            distance: r.distance !== undefined ? Number(r.distance) : r.distance,
            creator: {
                id: r.creatorId,
                name: r.creatorName || 'Unknown',
                avatar: r.creatorAvatar,
            },
            participants: [],
        }));
    }
    async findOne(userId, activityId) {
        const activity = await this.prisma.activity.findUnique({
            where: { id: activityId },
            include: {
                creator: {
                    include: { profile: true }
                },
                participants: {
                    take: 5,
                    where: { status: client_2.ActivityParticipantStatus.joined },
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
            throw new common_1.NotFoundException('Activity not found');
        }
        const [coords] = await this.prisma.$queryRaw `
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
        if (activity.privacy === client_2.ActivityPrivacy.private) {
            if (!userParticipant && activity.creatorId !== userId) {
                throw new common_1.ForbiddenException('This is a private activity');
            }
        }
        const participantsCount = await this.prisma.activityParticipant.count({
            where: {
                activityId,
                status: client_2.ActivityParticipantStatus.joined
            }
        });
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
            latitude: coords?.latitude !== undefined ? Number(coords.latitude) : coords?.latitude,
            longitude: coords?.longitude !== undefined ? Number(coords.longitude) : coords?.longitude,
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
    async join(userId, activityId) {
        const activity = await this.prisma.activity.findUnique({
            where: { id: activityId }
        });
        if (!activity)
            throw new common_1.NotFoundException('Activity not found');
        if (activity.status !== client_2.ActivityStatus.active)
            throw new common_1.BadRequestException('Activity is no longer active');
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (activity.womenOnly) {
            const userProfile = await this.prisma.profile.findUnique({
                where: { userId },
            });
            const allowedGenders = ['female', 'woman', 'non-binary', 'nonbinary'];
            const userGender = userProfile?.gender?.toLowerCase() || '';
            if (!allowedGenders.includes(userGender)) {
                throw new common_1.ForbiddenException('This activity is restricted to women and non-binary travelers');
            }
        }
        if (user.profile?.birthDate) {
            const age = this.calculateAge(user.profile.birthDate);
            if (age < activity.ageMin || age > activity.ageMax) {
                throw new common_1.ForbiddenException(`Activity is restricted to ages ${activity.ageMin}-${activity.ageMax}`);
            }
        }
        const status = activity.privacy === client_2.ActivityPrivacy.open
            ? client_2.ActivityParticipantStatus.joined
            : client_2.ActivityParticipantStatus.pending;
        try {
            const participant = await this.prisma.activityParticipant.create({
                data: {
                    activityId,
                    userId,
                    role: client_2.ActivityParticipantRole.guest,
                    status
                }
            });
            let conversationId;
            if (status === client_2.ActivityParticipantStatus.joined) {
                let conversation = await this.prisma.conversation.findFirst({
                    where: {
                        metadata: {
                            path: ['activityId'],
                            equals: activityId,
                        },
                    },
                });
                if (!conversation) {
                    conversation = await this.chatService.createConversation(activity.creatorId, [], 'group', activity.description || 'Activity Chat', {
                        activityId: activity.id,
                        activityTitle: activity.description,
                        activityEmoji: activity.emoji,
                        activityLocation: activity.locationText,
                    });
                }
                conversationId = conversation.id;
                await this.prisma.conversationParticipant.create({
                    data: {
                        conversationId,
                        userId,
                        role: 'member',
                    },
                }).catch((err) => {
                    if (err?.code !== 'P2002') {
                        throw err;
                    }
                });
            }
            if (status === client_2.ActivityParticipantStatus.pending) {
                const requesterProfile = await this.prisma.profile.findUnique({
                    where: { userId }
                });
                await this.notificationsService.notifyActivityJoinRequest(activity.creatorId, {
                    id: userId,
                    name: requesterProfile?.fullName || 'Someone',
                    avatar: requesterProfile?.avatarUrl ?? undefined,
                }, {
                    id: activityId,
                    description: activity.description ?? undefined,
                    emoji: activity.emoji ?? undefined,
                });
            }
            return {
                ...participant,
                conversationId,
                activityTitle: activity.description,
            };
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.BadRequestException('You have already requested to join this activity');
            }
            throw e;
        }
    }
    async leave(userId, activityId) {
        const participant = await this.prisma.activityParticipant.findUnique({
            where: { activityId_userId: { activityId, userId } }
        });
        if (!participant)
            throw new common_1.NotFoundException('You are not a participant');
        if (participant.role === client_2.ActivityParticipantRole.host) {
            throw new common_1.BadRequestException('Hosts cannot leave their own activity. Close it instead.');
        }
        return this.prisma.activityParticipant.delete({
            where: { activityId_userId: { activityId, userId } }
        });
    }
    async getParticipants(userId, activityId) {
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
    async approveParticipant(hostUserId, activityId, participantUserId) {
        const activity = await this.prisma.activity.findUnique({
            where: { id: activityId },
        });
        if (!activity)
            throw new common_1.NotFoundException('Activity not found');
        if (activity.creatorId !== hostUserId) {
            throw new common_1.ForbiddenException('Only the activity host can approve participants');
        }
        const participant = await this.prisma.activityParticipant.findUnique({
            where: { activityId_userId: { activityId, userId: participantUserId } },
        });
        if (!participant) {
            throw new common_1.NotFoundException('Participant not found');
        }
        if (participant.status !== client_2.ActivityParticipantStatus.pending) {
            throw new common_1.BadRequestException('Participant is not in pending status');
        }
        const updated = await this.prisma.activityParticipant.update({
            where: { activityId_userId: { activityId, userId: participantUserId } },
            data: { status: client_2.ActivityParticipantStatus.joined },
        });
        let conversation = await this.prisma.conversation.findFirst({
            where: {
                metadata: {
                    path: ['activityId'],
                    equals: activityId,
                },
            },
        });
        if (!conversation) {
            conversation = await this.chatService.createConversation(activity.creatorId, [], 'group', activity.description || 'Activity Chat', {
                activityId: activity.id,
                activityTitle: activity.description,
                activityEmoji: activity.emoji,
                activityLocation: activity.locationText,
            });
        }
        await this.prisma.conversationParticipant.create({
            data: {
                conversationId: conversation.id,
                userId: participantUserId,
                role: 'member',
            },
        }).catch((err) => {
            if (err?.code !== 'P2002')
                throw err;
        });
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
    async rejectParticipant(hostUserId, activityId, participantUserId) {
        const activity = await this.prisma.activity.findUnique({
            where: { id: activityId },
        });
        if (!activity)
            throw new common_1.NotFoundException('Activity not found');
        if (activity.creatorId !== hostUserId) {
            throw new common_1.ForbiddenException('Only the activity host can reject participants');
        }
        const participant = await this.prisma.activityParticipant.findUnique({
            where: { activityId_userId: { activityId, userId: participantUserId } },
        });
        if (!participant) {
            throw new common_1.NotFoundException('Participant not found');
        }
        if (participant.status !== client_2.ActivityParticipantStatus.pending) {
            throw new common_1.BadRequestException('Participant is not in pending status');
        }
        await this.prisma.activityParticipant.delete({
            where: { activityId_userId: { activityId, userId: participantUserId } },
        });
        await this.notificationsService.create({
            userId: participantUserId,
            type: 'activity_request_declined',
            title: 'Request Declined',
            body: `Your request to join "${activity.description}" was declined`,
            data: { activityId },
        });
        return { message: 'Participant rejected' };
    }
    async getPendingParticipants(hostUserId, activityId) {
        const activity = await this.prisma.activity.findUnique({
            where: { id: activityId },
        });
        if (!activity)
            throw new common_1.NotFoundException('Activity not found');
        if (activity.creatorId !== hostUserId) {
            throw new common_1.ForbiddenException('Only the activity host can view pending participants');
        }
        return this.prisma.activityParticipant.findMany({
            where: {
                activityId,
                status: client_2.ActivityParticipantStatus.pending,
            },
            include: {
                user: {
                    include: { profile: true },
                },
            },
            orderBy: { joinedAt: 'asc' },
        });
    }
    async getFeed(userId) {
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
        return activityItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        chat_service_1.ChatService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map