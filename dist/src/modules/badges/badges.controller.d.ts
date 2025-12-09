import { BadgesService } from './badges.service';
import { UsersService } from '../users/users.service';
export declare class BadgesController {
    private readonly badgesService;
    private readonly usersService;
    constructor(badgesService: BadgesService, usersService: UsersService);
    findAll(): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        icon: string | null;
        createdAt: Date;
    }[]>;
    getMyBadges(req: any): Promise<{
        code: string;
        name: string;
        description: string | null;
        icon: string | null;
        earnedAt: Date;
    }[]>;
    seedBadges(): Promise<{
        message: string;
    }>;
}
