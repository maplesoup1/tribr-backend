import { BadgeCategory, BadgeRarity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare const DEFAULT_BADGES: Array<{
    code: string;
    name: string;
    description: string;
    icon: string;
    category: BadgeCategory;
    rarity: BadgeRarity;
    requirement: string;
}>;
export declare class BadgesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findByCode(code: string): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        icon: string | null;
        category: import(".prisma/client").$Enums.BadgeCategory;
        rarity: import(".prisma/client").$Enums.BadgeRarity;
        requirement: string | null;
        createdAt: Date;
    }>;
    getUserBadges(userId: string): Promise<{
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
    getUserBadgeStats(userId: string): Promise<{
        total: number;
        unlocked: number;
        percentage: number;
    }>;
    getAllBadgesWithUserProgress(userId: string, category?: BadgeCategory): Promise<{
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
    awardBadge(userId: string, badgeCode: string): Promise<{
        message: string;
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
    }>;
    revokeBadge(userId: string, badgeCode: string): Promise<{
        message: string;
    }>;
    updateProgress(userId: string, badgeCode: string, progress: number): Promise<{
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
    seedDefaultBadges(): Promise<{
        message: string;
    }>;
}
