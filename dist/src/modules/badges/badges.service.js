"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgesService = exports.DEFAULT_BADGES = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
exports.DEFAULT_BADGES = [
    {
        code: 'first-steps',
        name: 'First Steps',
        description: 'Complete your first journey',
        icon: '👣',
        category: 'exploration',
        rarity: 'common',
        requirement: 'Complete 1 journey',
    },
    {
        code: 'globe-trotter',
        name: 'Globe Trotter',
        description: 'Visit 10 different countries',
        icon: '🌍',
        category: 'exploration',
        rarity: 'rare',
        requirement: 'Visit 10 countries',
    },
    {
        code: 'continent-collector',
        name: 'Continent Collector',
        description: 'Visit all 7 continents',
        icon: '🗺️',
        category: 'exploration',
        rarity: 'legendary',
        requirement: 'Visit 7 continents',
    },
    {
        code: 'city-explorer',
        name: 'City Explorer',
        description: 'Explore 25 different cities',
        icon: '🏙️',
        category: 'exploration',
        rarity: 'epic',
        requirement: 'Visit 25 cities',
    },
    {
        code: 'island-hopper',
        name: 'Island Hopper',
        description: 'Visit 5 island destinations',
        icon: '🏝️',
        category: 'exploration',
        rarity: 'rare',
        requirement: 'Visit 5 islands',
    },
    {
        code: 'social-butterfly',
        name: 'Social Butterfly',
        description: 'Connect with 50 travelers',
        icon: '🦋',
        category: 'social',
        rarity: 'rare',
        requirement: 'Make 50 connections',
    },
    {
        code: 'tribe-builder',
        name: 'Tribe Builder',
        description: 'Build a network of 100 travelers',
        icon: '👥',
        category: 'social',
        rarity: 'epic',
        requirement: 'Make 100 connections',
    },
    {
        code: 'local-guide',
        name: 'Local Guide',
        description: 'Share 10 location recommendations',
        icon: '📍',
        category: 'social',
        rarity: 'common',
        requirement: 'Share 10 recommendations',
    },
    {
        code: 'story-teller',
        name: 'Story Teller',
        description: 'Create 20 journal entries',
        icon: '📖',
        category: 'social',
        rarity: 'rare',
        requirement: 'Write 20 journal entries',
    },
    {
        code: 'mountain-climber',
        name: 'Mountain Climber',
        description: 'Reach 3 mountain peaks',
        icon: '⛰️',
        category: 'adventure',
        rarity: 'epic',
        requirement: 'Climb 3 mountains',
    },
    {
        code: 'beach-lover',
        name: 'Beach Lover',
        description: 'Visit 10 beaches',
        icon: '🏖️',
        category: 'adventure',
        rarity: 'common',
        requirement: 'Visit 10 beaches',
    },
    {
        code: 'desert-wanderer',
        name: 'Desert Wanderer',
        description: 'Explore 3 desert regions',
        icon: '🏜️',
        category: 'adventure',
        rarity: 'rare',
        requirement: 'Visit 3 deserts',
    },
    {
        code: 'jungle-explorer',
        name: 'Jungle Explorer',
        description: 'Trek through 2 rainforests',
        icon: '🌴',
        category: 'adventure',
        rarity: 'rare',
        requirement: 'Visit 2 rainforests',
    },
    {
        code: 'culture-vulture',
        name: 'Culture Vulture',
        description: 'Visit 15 museums or cultural sites',
        icon: '🏛️',
        category: 'culture',
        rarity: 'rare',
        requirement: 'Visit 15 cultural sites',
    },
    {
        code: 'foodie',
        name: 'Foodie',
        description: 'Try 20 local cuisines',
        icon: '🍜',
        category: 'culture',
        rarity: 'common',
        requirement: 'Try 20 local dishes',
    },
    {
        code: 'festival-goer',
        name: 'Festival Goer',
        description: 'Attend 5 cultural festivals',
        icon: '🎭',
        category: 'culture',
        rarity: 'epic',
        requirement: 'Attend 5 festivals',
    },
    {
        code: 'language-learner',
        name: 'Language Learner',
        description: 'Learn basic phrases in 5 languages',
        icon: '🗣️',
        category: 'culture',
        rarity: 'rare',
        requirement: 'Learn 5 languages',
    },
    {
        code: 'hundred-days',
        name: '100 Days',
        description: 'Travel for 100 days total',
        icon: '💯',
        category: 'milestone',
        rarity: 'epic',
        requirement: 'Travel 100 days',
    },
    {
        code: 'year-long',
        name: 'Year-Long Nomad',
        description: 'Travel for 365 consecutive days',
        icon: '🎯',
        category: 'milestone',
        rarity: 'legendary',
        requirement: 'Travel 365 days straight',
    },
    {
        code: 'early-bird',
        name: 'Early Bird',
        description: 'Join Tribr in its first year',
        icon: '🐣',
        category: 'milestone',
        rarity: 'rare',
        requirement: 'Be an early adopter',
    },
    {
        code: 'decade-traveler',
        name: 'Decade Traveler',
        description: 'Travel in 10 different years',
        icon: '⏰',
        category: 'milestone',
        rarity: 'legendary',
        requirement: 'Travel across 10 years',
    },
];
let BadgesService = class BadgesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(category) {
        return this.prisma.badge.findMany({
            where: category ? { category } : undefined,
            orderBy: [{ category: 'asc' }, { rarity: 'asc' }, { name: 'asc' }],
        });
    }
    async getStats() {
        const [total, byCategory, byRarity] = await Promise.all([
            this.prisma.badge.count(),
            this.prisma.badge.groupBy({
                by: ['category'],
                _count: true,
            }),
            this.prisma.badge.groupBy({
                by: ['rarity'],
                _count: true,
            }),
        ]);
        return {
            total,
            byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count])),
            byRarity: Object.fromEntries(byRarity.map((r) => [r.rarity, r._count])),
        };
    }
    async findByCode(code) {
        const badge = await this.prisma.badge.findUnique({
            where: { code },
        });
        if (!badge) {
            throw new common_1.NotFoundException(`Badge with code "${code}" not found`);
        }
        return badge;
    }
    async getUserBadges(userId) {
        const userBadges = await this.prisma.userBadge.findMany({
            where: { userId },
            include: { badge: true },
            orderBy: { earnedAt: 'desc' },
        });
        return userBadges.map((ub) => ({
            id: ub.badge.id,
            code: ub.badge.code,
            name: ub.badge.name,
            description: ub.badge.description,
            icon: ub.badge.icon,
            category: ub.badge.category,
            rarity: ub.badge.rarity,
            requirement: ub.badge.requirement,
            earnedAt: ub.earnedAt,
            progress: ub.progress,
            unlocked: ub.progress >= 100,
        }));
    }
    async getUserBadgeStats(userId) {
        const [totalBadges, userBadges] = await Promise.all([
            this.prisma.badge.count(),
            this.prisma.userBadge.count({ where: { userId, progress: { gte: 100 } } }),
        ]);
        return {
            total: totalBadges,
            unlocked: userBadges,
            percentage: totalBadges > 0 ? Math.round((userBadges / totalBadges) * 100) : 0,
        };
    }
    async getAllBadgesWithUserProgress(userId, category) {
        const [allBadges, userBadges] = await Promise.all([
            this.prisma.badge.findMany({
                where: category ? { category } : undefined,
                orderBy: [{ category: 'asc' }, { rarity: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.userBadge.findMany({
                where: { userId },
                select: { badgeId: true, progress: true, earnedAt: true },
            }),
        ]);
        const userBadgeMap = new Map(userBadges.map((ub) => [ub.badgeId, ub]));
        return allBadges.map((badge) => {
            const userBadge = userBadgeMap.get(badge.id);
            return {
                id: badge.id,
                code: badge.code,
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                category: badge.category,
                rarity: badge.rarity,
                requirement: badge.requirement,
                unlocked: userBadge ? userBadge.progress >= 100 : false,
                progress: userBadge?.progress ?? 0,
                earnedAt: userBadge?.earnedAt ?? null,
            };
        });
    }
    async awardBadge(userId, badgeCode) {
        const badge = await this.findByCode(badgeCode);
        const existing = await this.prisma.userBadge.findUnique({
            where: {
                userId_badgeId: {
                    userId,
                    badgeId: badge.id,
                },
            },
        });
        if (existing) {
            return { message: 'User already has this badge', badge };
        }
        await this.prisma.userBadge.create({
            data: {
                userId,
                badgeId: badge.id,
            },
        });
        return { message: 'Badge awarded successfully', badge };
    }
    async revokeBadge(userId, badgeCode) {
        const badge = await this.findByCode(badgeCode);
        await this.prisma.userBadge.deleteMany({
            where: {
                userId,
                badgeId: badge.id,
            },
        });
        return { message: 'Badge revoked successfully' };
    }
    async updateProgress(userId, badgeCode, progress) {
        const badge = await this.findByCode(badgeCode);
        const safeProgress = Math.max(0, Math.min(100, progress));
        const isCompleted = safeProgress >= 100;
        const existing = await this.prisma.userBadge.findUnique({
            where: {
                userId_badgeId: {
                    userId,
                    badgeId: badge.id,
                },
            },
        });
        const data = {
            progress: safeProgress,
        };
        if (isCompleted && (!existing || !existing.earnedAt)) {
            data.earnedAt = new Date();
        }
        const userBadge = await this.prisma.userBadge.upsert({
            where: {
                userId_badgeId: {
                    userId,
                    badgeId: badge.id,
                },
            },
            update: data,
            create: {
                userId,
                badgeId: badge.id,
                progress: safeProgress,
                earnedAt: isCompleted ? new Date() : new Date(0),
            },
        });
        return {
            ...userBadge,
            badge,
            unlocked: isCompleted,
        };
    }
    async seedDefaultBadges() {
        for (const badge of exports.DEFAULT_BADGES) {
            await this.prisma.badge.upsert({
                where: { code: badge.code },
                update: {},
                create: badge,
            });
        }
        return { message: `Seeded ${exports.DEFAULT_BADGES.length} default badges` };
    }
};
exports.BadgesService = BadgesService;
exports.BadgesService = BadgesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BadgesService);
//# sourceMappingURL=badges.service.js.map