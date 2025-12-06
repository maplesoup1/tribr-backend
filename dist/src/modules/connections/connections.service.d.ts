import { PrismaService } from '../../prisma/prisma.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { ConnectionStatus } from '@prisma/client';
export declare class ConnectionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private ensureNotSelf;
    create(currentUserId: string, dto: CreateConnectionDto): Promise<{
        id: string;
        createdAt: Date;
        userA: string;
        userB: string;
        status: import("@prisma/client").$Enums.ConnectionStatus;
        source: string | null;
    }>;
    listByUser(userId: string, status?: ConnectionStatus, take?: number, skip?: number): Promise<{
        id: string;
        createdAt: Date;
        userA: string;
        userB: string;
        status: import("@prisma/client").$Enums.ConnectionStatus;
        source: string | null;
    }[]>;
    updateStatus(id: string, status: ConnectionStatus, currentUserId: string): Promise<{
        id: string;
        createdAt: Date;
        userA: string;
        userB: string;
        status: import("@prisma/client").$Enums.ConnectionStatus;
        source: string | null;
    }>;
    remove(id: string, currentUserId: string): Promise<{
        id: string;
        createdAt: Date;
        userA: string;
        userB: string;
        status: import("@prisma/client").$Enums.ConnectionStatus;
        source: string | null;
    }>;
}
