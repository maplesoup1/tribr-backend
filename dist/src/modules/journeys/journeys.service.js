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
exports.JourneysService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let JourneysService = class JourneysService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(currentUserId, dto) {
        return this.prisma.journey.create({
            data: {
                userId: currentUserId,
                origin: dto.origin,
                destination: dto.destination,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                tripType: dto.tripType,
                transport: dto.transport,
                title: dto.title,
                description: dto.description,
                status: dto.status ?? client_1.JourneyStatus.draft,
            },
        });
    }
    async findVisibleForUser(requestorId, scope, take = 20, skip = 0) {
        const limit = Math.min(take, 100);
        if (scope === 'self') {
            return this.prisma.journey.findMany({
                where: { userId: requestorId },
                orderBy: { startDate: 'desc' },
                take: limit,
                skip,
            });
        }
        if (scope === 'connections') {
            return this.prisma.journey.findMany({
                where: {
                    user: {
                        profile: { visibility: client_1.Visibility.connections },
                    },
                    userId: {
                        in: await this.connectionsOf(requestorId),
                    },
                },
                orderBy: { startDate: 'desc' },
                take: limit,
                skip,
            });
        }
        const connectionIds = await this.connectionsOf(requestorId);
        return this.prisma.journey.findMany({
            where: {
                OR: [
                    { userId: requestorId },
                    { user: { profile: { visibility: client_1.Visibility.public } } },
                    {
                        userId: { in: connectionIds },
                        user: { profile: { visibility: client_1.Visibility.connections } },
                    },
                ],
            },
            orderBy: { startDate: 'desc' },
            take: limit,
            skip,
        });
    }
    async connectionsOf(userId) {
        const result = await this.prisma.$queryRaw `
      SELECT CASE
        WHEN "userA" = ${userId}::text THEN "userB"
        ELSE "userA"
      END as id
      FROM connections
      WHERE status = 'accepted'::"ConnectionStatus"
        AND (
          "userA" = ${userId}::text
          OR "userB" = ${userId}::text
        )
    `;
        return result.map((r) => r.id);
    }
    async findOne(id, currentUserId) {
        const journey = await this.prisma.journey.findUnique({
            where: { id },
            include: { user: { include: { profile: true } } },
        });
        if (!journey)
            throw new common_1.NotFoundException('Journey not found');
        const isOwner = journey.userId === currentUserId;
        const visibility = journey.user.profile?.visibility ?? client_1.Visibility.public;
        const isConnection = (await this.prisma.connection.count({
            where: {
                status: client_1.ConnectionStatus.accepted,
                OR: [
                    { userA: currentUserId, userB: journey.userId },
                    { userB: currentUserId, userA: journey.userId },
                ],
            },
        })) > 0;
        const allowed = isOwner ||
            visibility === client_1.Visibility.public ||
            (visibility === client_1.Visibility.connections && isConnection);
        if (!allowed) {
            throw new common_1.ForbiddenException();
        }
        return journey;
    }
    async update(id, dto, currentUserId) {
        const journey = await this.prisma.journey.findUnique({ where: { id } });
        if (!journey)
            throw new common_1.NotFoundException('Journey not found');
        if (journey.userId !== currentUserId)
            throw new common_1.ForbiddenException();
        return this.prisma.journey.update({
            where: { id },
            data: {
                origin: dto.origin,
                destination: dto.destination,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                tripType: dto.tripType,
                transport: dto.transport,
                title: dto.title,
                description: dto.description,
                status: dto.status,
            },
        });
    }
    async remove(id, currentUserId) {
        const journey = await this.prisma.journey.findUnique({ where: { id } });
        if (!journey)
            throw new common_1.NotFoundException('Journey not found');
        if (journey.userId !== currentUserId)
            throw new common_1.ForbiddenException();
        return this.prisma.journey.delete({ where: { id } });
    }
};
exports.JourneysService = JourneysService;
exports.JourneysService = JourneysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JourneysService);
//# sourceMappingURL=journeys.service.js.map