import { PrismaService } from '../../prisma/prisma.service';
export declare const DEFAULT_BADGES: {
    code: string;
    name: string;
    description: string;
    icon: string;
}[];
export declare class BadgesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        icon: string | null;
        createdAt: Date;
    }[]>;
    findByCode(code: string): Promise<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        icon: string | null;
        createdAt: Date;
    }>;
    getUserBadges(userId: string): Promise<{
        code: string;
        name: string;
        description: string | null;
        icon: string | null;
        earnedAt: Date;
    }[]>;
    awardBadge(userId: string, badgeCode: string): Promise<{
        message: string;
        badge: {
            id: string;
            code: string;
            name: string;
            description: string | null;
            icon: string | null;
            createdAt: Date;
        };
    }>;
    revokeBadge(userId: string, badgeCode: string): Promise<{
        message: string;
    }>;
    seedDefaultBadges(): Promise<{
        message: string;
    }>;
}
