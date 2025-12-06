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
    findAll(req: any, scope?: 'self' | 'connections' | 'public', take?: number, skip?: number): Promise<{
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
    findOne(id: string, req: any): Promise<{
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
    update(id: string, dto: UpdateJourneyDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
