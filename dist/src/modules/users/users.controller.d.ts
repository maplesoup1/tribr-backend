import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getCurrentUser(req: any): Promise<{
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
    updateCurrentUser(req: any, updateUserDto: UpdateUserDto): Promise<{
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
