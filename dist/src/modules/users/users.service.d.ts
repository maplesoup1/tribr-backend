import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        fullName: string | null;
        email: string | null;
        photoUrl: string | null;
        archetypes: string[];
        interests: string[];
        bio: string | null;
        id: string;
        phone: string;
        countryCode: string;
        onboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByPhone(phone: string): Promise<{
        fullName: string | null;
        email: string | null;
        photoUrl: string | null;
        archetypes: string[];
        interests: string[];
        bio: string | null;
        id: string;
        phone: string;
        countryCode: string;
        onboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findByEmail(email: string): Promise<{
        fullName: string | null;
        email: string | null;
        photoUrl: string | null;
        archetypes: string[];
        interests: string[];
        bio: string | null;
        id: string;
        phone: string;
        countryCode: string;
        onboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        fullName: string | null;
        email: string | null;
        photoUrl: string | null;
        archetypes: string[];
        interests: string[];
        bio: string | null;
        id: string;
        phone: string;
        countryCode: string;
        onboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    completeOnboarding(id: string): Promise<{
        fullName: string | null;
        email: string | null;
        photoUrl: string | null;
        archetypes: string[];
        interests: string[];
        bio: string | null;
        id: string;
        phone: string;
        countryCode: string;
        onboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createUser(data: {
        phone: string;
        countryCode?: string;
        email?: string;
        fullName?: string;
    }): Promise<{
        fullName: string | null;
        email: string | null;
        photoUrl: string | null;
        archetypes: string[];
        interests: string[];
        bio: string | null;
        id: string;
        phone: string;
        countryCode: string;
        onboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
