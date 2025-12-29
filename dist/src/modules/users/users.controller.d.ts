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
        languages: {
            id: string;
            userId: string;
            language: string;
            level: import(".prisma/client").$Enums.LanguageProficiency;
            createdAt: Date;
        }[];
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
        languages: {
            id: string;
            userId: string;
            language: string;
            level: import(".prisma/client").$Enums.LanguageProficiency;
            createdAt: Date;
        }[];
        badges: ({
            badge: {
                id: string;
                code: string;
                name: string;
                description: string | null;
                icon: string | null;
                category: import(".prisma/client").$Enums.BadgeCategory;
                rarity: import(".prisma/client").$Enums.BadgeRarity;
                requirement: string | null;
                createdAt: Date;
            };
        } & {
            userId: string;
            badgeId: string;
            earnedAt: Date;
            progress: number;
        })[];
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
        }) | null;
    }>;
    updateLocation(req: any, updateLocationDto: UpdateLocationDto): Promise<{
        message: string;
    }>;
    uploadVideo(req: any, file: Express.Multer.File): Promise<{
        message: string;
        videoIntroUrl: string;
        user: ({
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
        }) | null;
    }>;
    getNearby(req: any, query: NearbyQueryDto): Promise<{
        id: string;
        name: string;
        avatar: string | null;
        location: {
            latitude: number;
            longitude: number;
            city: string | null;
            country: string | null;
        };
        distance: string;
    }[]>;
    getDestinationStats(location: string): Promise<{
        location: string;
        currentCount: number;
        incomingCount: number;
        totalCount: number;
        trending: boolean;
    }>;
    getUserById(id: string): Promise<{
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
        languages: {
            id: string;
            userId: string;
            language: string;
            level: import(".prisma/client").$Enums.LanguageProficiency;
            createdAt: Date;
        }[];
        id: string;
        phone: string | null;
        countryCode: string;
        email: string;
        onboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
