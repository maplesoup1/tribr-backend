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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.notification.create({
            data: {
                userId: dto.userId,
                type: dto.type,
                title: dto.title,
                body: dto.body,
                data: dto.data,
            },
        });
    }
    async findAllByUser(userId, options = {}) {
        const { take = 50, skip = 0, unreadOnly = false } = options;
        const limit = Math.min(take, 100);
        return this.prisma.notification.findMany({
            where: {
                userId,
                ...(unreadOnly && { isRead: false }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }
    async getNoticeboard(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const updates = [];
        const recentActivities = await this.prisma.activity.findMany({
            where: {
                privacy: 'open',
                status: 'active',
                date: {
                    gte: today,
                },
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                fullName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                participants: true,
            },
        });
        const recentJourneys = await this.prisma.journey.findMany({
            where: {
                status: { in: ['active', 'draft'] },
                destination: { not: null },
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                fullName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
        for (const activity of recentActivities) {
            updates.push({
                id: `act_${activity.id}`,
                type: 'meetup',
                name: activity.description || 'Group Meetup',
                location: activity.locationText || 'Unknown Location',
                area: activity.locationText?.split(',')[0] || 'Nearby',
                timeAgo: 'Just now',
                dateInfo: activity.date.toISOString().split('T')[0],
                participants: activity.participants.length,
                createdAt: activity.createdAt,
                user: {
                    id: activity.creator.id,
                    name: activity.creator.profile?.fullName || 'Tribr User',
                    avatar: activity.creator.profile?.avatarUrl,
                },
            });
        }
        for (const journey of recentJourneys) {
            const isArrived = journey.startDate && new Date(journey.startDate) <= new Date();
            updates.push({
                id: `jny_${journey.id}`,
                type: isArrived ? 'arrived' : 'heading',
                name: journey.user.profile?.fullName || 'Tribr User',
                location: journey.destination || 'Unknown',
                area: journey.destination?.split(',')[0] || 'Unknown',
                timeAgo: 'Recently',
                dateInfo: journey.startDate ? new Date(journey.startDate).toDateString() : 'Soon',
                createdAt: journey.createdAt,
                user: {
                    id: journey.user.id,
                    name: journey.user.profile?.fullName || 'Tribr User',
                    avatar: journey.user.profile?.avatarUrl,
                },
            });
        }
        return updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async markAsRead(id, userId) {
        return this.prisma.notification.updateMany({
            where: {
                id,
                userId,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }
    async delete(id, userId) {
        return this.prisma.notification.deleteMany({
            where: {
                id,
                userId,
            },
        });
    }
    async notifyActivityJoinRequest(activityOwnerId, fromUser, activity) {
        return this.create({
            userId: activityOwnerId,
            type: client_1.NotificationType.activity_join_request,
            title: `${fromUser.name} wants to join your activity`,
            body: activity.description,
            data: {
                activityId: activity.id,
                activityName: activity.description,
                activityEmoji: activity.emoji,
                fromUserId: fromUser.id,
                fromUserName: fromUser.name,
                fromUserAvatar: fromUser.avatar,
            },
        });
    }
    async notifyActivityRequestApproved(requesterId, activity) {
        return this.create({
            userId: requesterId,
            type: client_1.NotificationType.activity_request_approved,
            title: 'Your join request was approved!',
            body: activity.description,
            data: {
                activityId: activity.id,
                activityName: activity.description,
                activityEmoji: activity.emoji,
            },
        });
    }
    async notifyConnectionRequest(recipientId, fromUser, connectionId) {
        return this.create({
            userId: recipientId,
            type: client_1.NotificationType.connection_request,
            title: `${fromUser.name} wants to connect with you`,
            data: {
                connectionId,
                fromUserId: fromUser.id,
                fromUserName: fromUser.name,
                fromUserAvatar: fromUser.avatar,
            },
        });
    }
    async notifyConnectionAccepted(requesterId, acceptedBy, connectionId) {
        return this.create({
            userId: requesterId,
            type: client_1.NotificationType.connection_accepted,
            title: `${acceptedBy.name} accepted your connection request`,
            data: {
                connectionId,
                fromUserId: acceptedBy.id,
                fromUserName: acceptedBy.name,
                fromUserAvatar: acceptedBy.avatar,
            },
        });
    }
    async notifyNewMessage(recipientId, fromUser, conversationId, messagePreview) {
        return this.create({
            userId: recipientId,
            type: client_1.NotificationType.new_message,
            title: `${fromUser.name} sent you a message`,
            body: messagePreview,
            data: {
                conversationId,
                fromUserId: fromUser.id,
                fromUserName: fromUser.name,
                fromUserAvatar: fromUser.avatar,
            },
        });
    }
    async notifySystem(userId, title, body) {
        return this.create({
            userId,
            type: client_1.NotificationType.system,
            title,
            body,
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map