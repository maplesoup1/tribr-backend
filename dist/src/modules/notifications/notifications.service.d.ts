import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
export interface CreateNotificationDto {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: {
        activityId?: string;
        activityName?: string;
        activityEmoji?: string;
        connectionId?: string;
        conversationId?: string;
        fromUserId?: string;
        fromUserName?: string;
        fromUserAvatar?: string;
    };
}
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateNotificationDto): Promise<{
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string | null;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        createdAt: Date;
        readAt: Date | null;
    }>;
    findAllByUser(userId: string, options?: {
        take?: number;
        skip?: number;
        unreadOnly?: boolean;
    }): Promise<{
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string | null;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        createdAt: Date;
        readAt: Date | null;
    }[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    delete(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    notifyActivityJoinRequest(activityOwnerId: string, fromUser: {
        id: string;
        name: string;
        avatar?: string;
    }, activity: {
        id: string;
        description?: string;
        emoji?: string;
    }): Promise<{
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string | null;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        createdAt: Date;
        readAt: Date | null;
    }>;
    notifyActivityRequestApproved(requesterId: string, activity: {
        id: string;
        description?: string;
        emoji?: string;
    }): Promise<{
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string | null;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        createdAt: Date;
        readAt: Date | null;
    }>;
    notifyConnectionRequest(recipientId: string, fromUser: {
        id: string;
        name: string;
        avatar?: string;
    }, connectionId: string): Promise<{
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string | null;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        createdAt: Date;
        readAt: Date | null;
    }>;
    notifyConnectionAccepted(requesterId: string, acceptedBy: {
        id: string;
        name: string;
        avatar?: string;
    }, connectionId: string): Promise<{
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string | null;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        createdAt: Date;
        readAt: Date | null;
    }>;
    notifyNewMessage(recipientId: string, fromUser: {
        id: string;
        name: string;
        avatar?: string;
    }, conversationId: string, messagePreview?: string): Promise<{
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string | null;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        createdAt: Date;
        readAt: Date | null;
    }>;
    notifySystem(userId: string, title: string, body?: string): Promise<{
        id: string;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        body: string | null;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        createdAt: Date;
        readAt: Date | null;
    }>;
}
