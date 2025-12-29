import { PrismaService } from '../../prisma/prisma.service';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { UpdateJourneyDto } from './dto/update-journey.dto';
export declare class JourneysService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(currentUserId: string, dto: CreateJourneyDto): Promise<{
        id: string;
        userId: string;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        transport: import(".prisma/client").$Enums.TransportMode | null;
        title: string | null;
        description: string | null;
        status: import(".prisma/client").$Enums.JourneyStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findVisibleForUser(requestorId: string, scope?: 'self' | 'connections' | 'public', take?: number, skip?: number): Promise<{
        id: string;
        userId: string;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        transport: import(".prisma/client").$Enums.TransportMode | null;
        title: string | null;
        description: string | null;
        status: import(".prisma/client").$Enums.JourneyStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    private connectionsOf;
    findOne(id: string, currentUserId: string): Promise<{
        user: {
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
        userId: string;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        transport: import(".prisma/client").$Enums.TransportMode | null;
        title: string | null;
        description: string | null;
        status: import(".prisma/client").$Enums.JourneyStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateJourneyDto, currentUserId: string): Promise<{
        id: string;
        userId: string;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        transport: import(".prisma/client").$Enums.TransportMode | null;
        title: string | null;
        description: string | null;
        status: import(".prisma/client").$Enums.JourneyStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, currentUserId: string): Promise<{
        id: string;
        userId: string;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        transport: import(".prisma/client").$Enums.TransportMode | null;
        title: string | null;
        description: string | null;
        status: import(".prisma/client").$Enums.JourneyStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
