import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getCurrentUser(req: any): Promise<{
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
    updateCurrentUser(req: any, updateUserDto: UpdateUserDto): Promise<{
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
