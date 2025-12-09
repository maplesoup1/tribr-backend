import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly supabaseService;
    constructor(prisma: PrismaService, supabaseService: SupabaseService);
    findById(id: string): Promise<{
        id: string;
        phone: string | null;
        countryCode: string;
        email: string;
        onboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByPhone(phone: string): Promise<{
        id: string;
        phone: string | null;
        countryCode: string;
        email: string;
        onboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findByEmail(email: string): Promise<{
        id: string;
        phone: string | null;
        countryCode: string;
        email: string;
        onboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
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
    }>;
    createUser(data: {
        phone?: string;
        countryCode?: string;
        email: string;
        fullName?: string;
    }): Promise<{
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
    }>;
    upsertUser(data: {
        phone?: string;
        countryCode?: string;
        email?: string;
        fullName?: string;
    }): Promise<{
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
    }>;
    getOrCreateFromSupabaseUser(supabaseUser: any): Promise<{
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
    }>;
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<{
        message: string;
        avatarUrl: string;
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
    }>;
    getProfileWithStats(userId: string): Promise<{
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
    private calculateTrustScore;
}
