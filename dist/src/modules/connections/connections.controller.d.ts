import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { ConnectionStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';
export declare class ConnectionsController {
    private readonly connectionsService;
    private readonly usersService;
    constructor(connectionsService: ConnectionsService, usersService: UsersService);
    create(req: any, dto: CreateConnectionDto): Promise<{
        id: string;
        userA: string;
        userB: string;
        requesterId: string | null;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    }>;
    findAll(req: any, status?: ConnectionStatus, take?: number, skip?: number): Promise<{
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
    update(id: string, req: any, dto: UpdateConnectionDto): Promise<{
        id: string;
        userA: string;
        userB: string;
        requesterId: string | null;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        userA: string;
        userB: string;
        requesterId: string | null;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    }>;
}
