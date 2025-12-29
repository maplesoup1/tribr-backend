import { PrismaService } from '../../prisma/prisma.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { ConnectionStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ConnectionsService {
    private readonly prisma;
    private readonly notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    private ensureNotSelf;
    create(currentUserId: string, dto: CreateConnectionDto): Promise<{
        id: string;
        userA: string;
        userB: string;
        requesterId: string | null;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    }>;
    listByUser(userId: string, status?: ConnectionStatus, take?: number, skip?: number): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        createdAt: Date;
        direction: string;
        otherUser: {
            id: string;
            name: string;
            avatar: string | undefined;
            city: string | undefined;
            country: string | undefined;
        };
        distanceKm: number | null;
    }[]>;
    updateStatus(id: string, status: ConnectionStatus, currentUserId: string): Promise<{
        id: string;
        userA: string;
        userB: string;
        requesterId: string | null;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    }>;
    decline(id: string, currentUserId: string): Promise<{
        id: string;
        userA: string;
        userB: string;
        requesterId: string | null;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    }>;
    getPendingRequests(userId: string, take?: number, skip?: number): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        createdAt: Date;
        otherUser: {
            id: string;
            name: string;
            avatar: string | undefined;
            city: string | undefined;
            country: string | undefined;
        };
    }[]>;
    remove(id: string, currentUserId: string): Promise<{
        id: string;
        userA: string;
        userB: string;
        requesterId: string | null;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    }>;
}
