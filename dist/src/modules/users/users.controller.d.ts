import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getCurrentUser(req: any): Promise<{
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
    updateCurrentUser(req: any, updateUserDto: UpdateUserDto): Promise<{
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
