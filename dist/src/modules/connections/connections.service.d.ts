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
    getPendingRequests(userId: string, take?: number, skip?: number): Promise<({
        userARelation: {
            profile: {
                userId: string;
                fullName: string | null;
                avatarUrl: string | null;
                visibility: import(".prisma/client").$Enums.Visibility;
                verificationLevel: number;
                gender: string | null;
                birthDate: Date | null;
                city: string | null;
                country: string | null;
                archetypes: string[];
                interests: string[];
                travelStyles: string[];
                bio: string | null;
                username: string | null;
                instagramHandle: string | null;
                tiktokHandle: string | null;
                youtubeUrl: string | null;
                videoIntroUrl: string | null;
            } | null;
        } & {
            id: string;
            phone: string | null;
            countryCode: string;
            email: string;
            onboardingComplete: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        userBRelation: {
            profile: {
                userId: string;
                fullName: string | null;
                avatarUrl: string | null;
                visibility: import(".prisma/client").$Enums.Visibility;
                verificationLevel: number;
                gender: string | null;
                birthDate: Date | null;
                city: string | null;
                country: string | null;
                archetypes: string[];
                interests: string[];
                travelStyles: string[];
                bio: string | null;
                username: string | null;
                instagramHandle: string | null;
                tiktokHandle: string | null;
                youtubeUrl: string | null;
                videoIntroUrl: string | null;
            } | null;
        } & {
            id: string;
            phone: string | null;
            countryCode: string;
            email: string;
            onboardingComplete: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        userA: string;
        userB: string;
        requesterId: string | null;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        source: string | null;
        createdAt: Date;
    })[]>;
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
