import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getCurrentUser(req: any): Promise<{
        badges: {
            code: string;
            name: string;
            description: string | null;
            icon: string | null;
            earnedAt: Date;
        }[];
        stats: {
            trustScore: number;
            tripsCount: number;
            connectionsCount: number;
        };
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
            travelStyles: string[];
            bio: string | null;
        } | null;
        id: string;
        phone: string | null;
        countryCode: string;
        email: string;
        onboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateCurrentUser(req: any, updateUserDto: UpdateUserDto): Promise<{
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
            travelStyles: string[];
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
    }>;
    uploadAvatar(req: any, file: Express.Multer.File): Promise<{
        message: string;
        avatarUrl: string;
        user: ({
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
                travelStyles: string[];
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
        }) | null;
    }>;
    updateLocation(req: any, updateLocationDto: UpdateLocationDto): Promise<{
        message: string;
    }>;
    getNearby(req: any, query: NearbyQueryDto): Promise<{
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
        city: string | null;
        country: string | null;
        latitude: number;
        longitude: number;
        distance: number;
        updatedAt: Date;
    }[]>;
}
