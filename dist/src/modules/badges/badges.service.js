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
        code: 'verified_id',
        name: 'Verified ID',
        description: 'Completed ID & phone verification',
        icon: 'shield-check',
    },
    {
        code: 'community_guide',
        name: 'Community Guide',
        description: 'Helped 10 travelers',
        icon: 'users',
    },
    {
        code: 'early_explorer',
        name: 'Early Explorer',
        description: 'Joined Tribr in beta',
        icon: 'compass',
    },
    {
        code: 'city_host',
        name: 'City Host',
        description: 'Hosted meetups in 3 cities',
        icon: 'map-pin',
    },
    {
        code: 'globe_trotter',
        name: 'Globe Trotter',
        description: 'Visited 10 different countries',
        icon: 'globe',
    },
    {
        code: 'trusted_traveler',
        name: 'Trusted Traveler',
        description: 'Achieved trust score of 80+',
        icon: 'star',
    },
];
let BadgesService = class BadgesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.badge.findMany({
            orderBy: { name: 'asc' },
        });
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
            code: ub.badge.code,
            name: ub.badge.name,
            description: ub.badge.description,
            icon: ub.badge.icon,
            earnedAt: ub.earnedAt,
        }));
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