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
let ActivitiesService = class ActivitiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
        return this.findOne(userId, activity.id);
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
        return results.map(r => ({
            ...r,
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
            const age = new Date().getFullYear() - user.profile.birthDate.getFullYear();
            if (age < activity.ageMin || age > activity.ageMax) {
                throw new common_1.ForbiddenException(`Activity is restricted to ages ${activity.ageMin}-${activity.ageMax}`);
            }
        }
        const status = activity.privacy === client_2.ActivityPrivacy.open
            ? client_2.ActivityParticipantStatus.joined
            : client_2.ActivityParticipantStatus.pending;
        try {
            return await this.prisma.activityParticipant.create({
                data: {
                    activityId,
                    userId,
                    role: client_2.ActivityParticipantRole.guest,
                    status
                }
            });
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
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map