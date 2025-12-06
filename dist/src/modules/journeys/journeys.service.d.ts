import { PrismaService } from '../../prisma/prisma.service';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { UpdateJourneyDto } from './dto/update-journey.dto';
export declare class JourneysService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(currentUserId: string, dto: CreateJourneyDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.JourneyStatus;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        title: string | null;
        description: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
    }>;
    findVisibleForUser(requestorId: string, scope?: 'self' | 'connections' | 'public', take?: number, skip?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.JourneyStatus;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        title: string | null;
        description: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
    }[]>;
    private connectionsOf;
    findOne(id: string, currentUserId: string): Promise<{
        user: {
            profile: {
                fullName: string | null;
                archetypes: string[];
                interests: string[];
                bio: string | null;
                avatarUrl: string | null;
                visibility: import("@prisma/client").$Enums.Visibility;
                verificationLevel: number;
                userId: string;
            } | null;
        } & {
            id: string;
            phone: string | null;
            email: string;
            countryCode: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.JourneyStatus;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        title: string | null;
        description: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
    }>;
    update(id: string, dto: UpdateJourneyDto, currentUserId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.JourneyStatus;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        title: string | null;
        description: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
    }>;
    remove(id: string, currentUserId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.JourneyStatus;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        title: string | null;
        description: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
    }>;
}
