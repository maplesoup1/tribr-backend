import { JourneysService } from './journeys.service';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import { UsersService } from '../users/users.service';
export declare class JourneysController {
    private readonly journeysService;
    private readonly usersService;
    constructor(journeysService: JourneysService, usersService: UsersService);
    create(req: any, dto: CreateJourneyDto): Promise<{
        id: string;
        userId: string;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        title: string | null;
        description: string | null;
        status: import(".prisma/client").$Enums.JourneyStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(req: any, scope?: 'self' | 'connections' | 'public', take?: number, skip?: number): Promise<{
        id: string;
        userId: string;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        title: string | null;
        description: string | null;
        status: import(".prisma/client").$Enums.JourneyStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string, req: any): Promise<{
        user: {
            profile: {
                userId: string;
                fullName: string | null;
                avatarUrl: string | null;
                visibility: import(".prisma/client").$Enums.Visibility;
                verificationLevel: number;
                city: string | null;
                country: string | null;
                archetypes: string[];
                interests: string[];
                bio: string | null;
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
        title: string | null;
        description: string | null;
        status: import(".prisma/client").$Enums.JourneyStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateJourneyDto, req: any): Promise<{
        id: string;
        userId: string;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        title: string | null;
        description: string | null;
        status: import(".prisma/client").$Enums.JourneyStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        userId: string;
        origin: string | null;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tripType: string | null;
        title: string | null;
        description: string | null;
        status: import(".prisma/client").$Enums.JourneyStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
