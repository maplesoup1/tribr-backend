import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNoticeboard(req: any): Promise<import("./notifications.service").NoticeboardUpdate[]>;
    findAll(req: any, take?: string, skip?: string, unreadOnly?: string): Promise<{
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
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    markAsRead(req: any, id: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(req: any): Promise<{
        success: boolean;
    }>;
    delete(req: any, id: string): Promise<{
        success: boolean;
    }>;
}
