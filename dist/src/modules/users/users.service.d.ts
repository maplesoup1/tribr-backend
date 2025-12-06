import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        id: string;
        phone: string | null;
        email: string;
        countryCode: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByPhone(phone: string): Promise<{
        id: string;
        phone: string | null;
        email: string;
        countryCode: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findByEmail(email: string): Promise<{
        id: string;
        phone: string | null;
        email: string;
        countryCode: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
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
    }>;
    createUser(data: {
        phone?: string;
        countryCode?: string;
        email: string;
        fullName?: string;
    }): Promise<{
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
    }>;
    upsertUser(data: {
        phone?: string;
        countryCode?: string;
        email?: string;
        fullName?: string;
    }): Promise<{
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
    }>;
    getOrCreateFromSupabaseUser(supabaseUser: any): Promise<{
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
    }>;
}
