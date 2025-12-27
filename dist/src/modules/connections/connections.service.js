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
exports.ConnectionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
let ConnectionsService = class ConnectionsService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    ensureNotSelf(userA, userB) {
        if (userA === userB) {
            throw new common_1.BadRequestException('Cannot connect to yourself');
        }
    }
    async create(currentUserId, dto) {
        const rawA = currentUserId;
        const rawB = dto.userB;
        this.ensureNotSelf(rawA, rawB);
        const [userA, userB] = rawA < rawB ? [rawA, rawB] : [rawB, rawA];
        const blocked = await this.prisma.userBlock.count({
            where: {
                OR: [
                    { blockerId: userA, blockedId: userB },
                    { blockerId: userB, blockedId: userA },
                ],
            },
        });
        if (blocked > 0) {
            throw new common_1.BadRequestException('Connection not allowed due to block settings');
        }
        try {
            const connection = await this.prisma.connection.create({
                data: {
                    userA,
                    userB,
                    requesterId: currentUserId,
                    status: dto.status ?? client_2.ConnectionStatus.pending,
                    source: dto.source,
                },
            });
            if (connection.status === client_2.ConnectionStatus.pending) {
                const senderProfile = await this.prisma.profile.findUnique({
                    where: { userId: currentUserId },
                });
                const recipientId = userA === currentUserId ? userB : userA;
                await this.notificationsService.notifyConnectionRequest(recipientId, {
                    id: currentUserId,
                    name: senderProfile?.fullName || 'Someone',
                    avatar: senderProfile?.avatarUrl ?? undefined,
                }, connection.id);
            }
            return connection;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.BadRequestException('Connection already exists between these users');
            }
            if (error.code === 'P2003') {
                throw new common_1.BadRequestException('One or both users do not exist');
            }
            if (error.code === 'P2023') {
                throw new common_1.BadRequestException('Invalid user ID format');
            }
            if (error.code === 'P2010') {
                throw new common_1.BadRequestException('Invalid connection: users must be different');
            }
            console.error('Connection creation error:', error);
            throw new common_1.BadRequestException('Unable to create connection');
        }
    }
    async listByUser(userId, status, take = 50, skip = 0) {
        const limit = Math.min(take, 100);
        const statusFilter = status
            ? client_1.Prisma.sql `AND c.status = ${status}::"ConnectionStatus"`
            : client_1.Prisma.sql ``;
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
      WITH current_loc AS (
        SELECT location FROM user_locations WHERE "userId" = ${userId}::text
      )
      SELECT
        c.id,
        c.status,
        c."createdAt",
        c."requesterId",
        CASE WHEN c."userA" = ${userId}::text THEN c."userB" ELSE c."userA" END AS "otherUserId",
        p."fullName",
        p."avatarUrl",
        p.city,
        p.country,
        CASE
          WHEN (SELECT location FROM current_loc) IS NULL THEN NULL
          WHEN ul.location IS NULL THEN NULL
          ELSE ST_Distance(ul.location, (SELECT location FROM current_loc))
        END AS distance_meters
      FROM connections c
      JOIN users u ON u.id = CASE WHEN c."userA" = ${userId}::text THEN c."userB" ELSE c."userA" END
      LEFT JOIN profiles p ON p."userId" = u.id
      LEFT JOIN user_locations ul ON ul."userId" = u.id
      WHERE
        (c."userA" = ${userId}::text OR c."userB" = ${userId}::text)
        ${statusFilter}
      ORDER BY c."createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `);
        return rows.map((row) => ({
            id: row.id,
            status: row.status,
            createdAt: row.createdAt,
            direction: row.requesterId === userId ? 'outgoing' : 'incoming',
            otherUser: {
                id: row.otherUserId,
                name: row.fullName || 'Traveler',
                avatar: row.avatarUrl || undefined,
                city: row.city || undefined,
                country: row.country || undefined,
            },
            distanceKm: row.distance_meters != null
                ? Math.round((Number(row.distance_meters) / 1000) * 10) / 10
                : null,
        }));
    }
    async updateStatus(id, status, currentUserId) {
        const connection = await this.prisma.connection.findUnique({
            where: { id },
        });
        if (!connection) {
            throw new common_1.BadRequestException('Connection not found');
        }
        if (connection.userA !== currentUserId &&
            connection.userB !== currentUserId) {
            throw new common_1.ForbiddenException();
        }
        if (connection.status === client_2.ConnectionStatus.accepted) {
            throw new common_1.BadRequestException('Accepted connections cannot change status');
        }
        if (connection.status === client_2.ConnectionStatus.declined) {
            throw new common_1.BadRequestException('Declined connections cannot be modified. Send a new request instead.');
        }
        if (connection.status === client_2.ConnectionStatus.pending) {
            const allowedNext = [
                client_2.ConnectionStatus.accepted,
                client_2.ConnectionStatus.declined,
            ];
            if (!allowedNext.includes(status)) {
                throw new common_1.BadRequestException('Invalid status transition');
            }
            if (connection.requesterId) {
                if (connection.requesterId === currentUserId) {
                    throw new common_1.ForbiddenException('You cannot accept/decline your own connection request');
                }
            }
            else {
            }
        }
        const updatedConnection = await this.prisma.connection.update({
            where: { id },
            data: { status },
        });
        if (status === client_2.ConnectionStatus.accepted) {
            const accepterProfile = await this.prisma.profile.findUnique({
                where: { userId: currentUserId },
            });
            const recipientId = connection.requesterId
                ? connection.requesterId
                : (connection.userA === currentUserId ? connection.userB : connection.userA);
            await this.notificationsService.notifyConnectionAccepted(recipientId, {
                id: currentUserId,
                name: accepterProfile?.fullName || 'Someone',
                avatar: accepterProfile?.avatarUrl ?? undefined,
            }, updatedConnection.id);
        }
        return updatedConnection;
    }
    async decline(id, currentUserId) {
        const connection = await this.prisma.connection.findUnique({
            where: { id },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection not found');
        }
        if (connection.status !== client_2.ConnectionStatus.pending) {
            throw new common_1.BadRequestException('Only pending connections can be declined');
        }
        if (connection.requesterId) {
            if (connection.requesterId === currentUserId) {
                throw new common_1.ForbiddenException('You cannot decline your own request. Delete it instead.');
            }
        }
        else {
        }
        return this.prisma.connection.update({
            where: { id },
            data: { status: client_2.ConnectionStatus.declined },
        });
    }
    async getPendingRequests(userId, take = 50, skip = 0) {
        const limit = Math.min(take, 100);
        return this.prisma.connection.findMany({
            where: {
                OR: [
                    { userA: userId },
                    { userB: userId }
                ],
                requesterId: { not: userId },
                status: client_2.ConnectionStatus.pending,
            },
            include: {
                userARelation: {
                    include: { profile: true },
                },
                userBRelation: {
                    include: { profile: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
        });
    }
    async remove(id, currentUserId) {
        const connection = await this.prisma.connection.findUnique({
            where: { id },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection not found');
        }
        if (connection.userA !== currentUserId &&
            connection.userB !== currentUserId) {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.connection.delete({ where: { id } });
    }
};
exports.ConnectionsService = ConnectionsService;
exports.ConnectionsService = ConnectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ConnectionsService);
//# sourceMappingURL=connections.service.js.map