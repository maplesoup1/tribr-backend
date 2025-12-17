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
let ConnectionsService = class ConnectionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
            return await this.prisma.connection.create({
                data: {
                    userA,
                    userB,
                    status: dto.status ?? client_1.ConnectionStatus.pending,
                    source: dto.source,
                },
            });
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
        return this.prisma.connection.findMany({
            where: {
                ...(status && { status }),
                OR: [{ userA: userId }, { userB: userId }],
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
        });
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
        if (connection.status === client_1.ConnectionStatus.accepted &&
            status !== client_1.ConnectionStatus.accepted) {
            throw new common_1.BadRequestException('Accepted connections cannot change status');
        }
        if (connection.status === client_1.ConnectionStatus.pending) {
            if (![client_1.ConnectionStatus.accepted, client_1.ConnectionStatus.pending].includes(status)) {
                throw new common_1.BadRequestException('Invalid status transition');
            }
            if (status === client_1.ConnectionStatus.accepted &&
                connection.userB !== currentUserId) {
                throw new common_1.ForbiddenException('Only the recipient can accept the connection');
            }
        }
        return this.prisma.connection.update({
            where: { id },
            data: { status },
        });
    }
    async remove(id, currentUserId) {
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
        return this.prisma.connection.delete({ where: { id } });
    }
};
exports.ConnectionsService = ConnectionsService;
exports.ConnectionsService = ConnectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConnectionsService);
//# sourceMappingURL=connections.service.js.map