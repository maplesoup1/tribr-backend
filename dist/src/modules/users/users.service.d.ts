import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
}
