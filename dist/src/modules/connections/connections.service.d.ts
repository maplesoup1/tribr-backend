import { PrismaService } from '../../prisma/prisma.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { ConnectionStatus } from '@prisma/client';
export declare class ConnectionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private ensureNotSelf;
    create(currentUserId: string, dto: CreateConnectionDto): Promise<{
        id: string;
        userA: string;
        userB: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    }>;
    listByUser(userId: string, status?: ConnectionStatus, take?: number, skip?: number): Promise<{
        id: string;
        userA: string;
        userB: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    }[]>;
    updateStatus(id: string, status: ConnectionStatus, currentUserId: string): Promise<{
        id: string;
        userA: string;
        userB: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    }>;
    remove(id: string, currentUserId: string): Promise<{
        id: string;
        userA: string;
        userB: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    }>;
}
