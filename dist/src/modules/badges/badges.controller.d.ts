import { BadgesService } from './badges.service';
import { UsersService } from '../users/users.service';
import { BadgeCategory } from '@prisma/client';
export declare class BadgesController {
    private readonly badgesService;
    private readonly usersService;
    constructor(badgesService: BadgesService, usersService: UsersService);
    findAll(category?: BadgeCategory): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        icon: string | null;
        category: import(".prisma/client").$Enums.BadgeCategory;
        rarity: import(".prisma/client").$Enums.BadgeRarity;
        requirement: string | null;
        createdAt: Date;
    }[]>;
    getStats(): Promise<{
        total: number;
        byCategory: {
            [k: string]: number;
        };
        byRarity: {
            [k: string]: number;
        };
    }>;
    getMyBadges(req: any): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        icon: string | null;
        category: import(".prisma/client").$Enums.BadgeCategory;
        rarity: import(".prisma/client").$Enums.BadgeRarity;
        requirement: string | null;
        earnedAt: Date;
        progress: number;
        unlocked: boolean;
    }[]>;
    getMyBadgeStats(req: any): Promise<{
        total: number;
        unlocked: number;
        percentage: number;
    }>;
    getAllWithMyProgress(req: any, category?: BadgeCategory): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        icon: string | null;
        category: import(".prisma/client").$Enums.BadgeCategory;
        rarity: import(".prisma/client").$Enums.BadgeRarity;
        requirement: string | null;
        unlocked: boolean;
        progress: number;
        earnedAt: Date | null;
    }[]>;
    seedBadges(): Promise<{
        message: string;
    }>;
    updateProgress(req: any, code: string, progress: number): Promise<{
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
        unlocked: boolean;
        userId: string;
        badgeId: string;
        earnedAt: Date;
        progress: number;
    }>;
}
