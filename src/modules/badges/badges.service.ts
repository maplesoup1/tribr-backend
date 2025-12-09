import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Default badges to seed
export const DEFAULT_BADGES = [
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

@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all available badges
   */
  async findAll() {
    return this.prisma.badge.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a badge by code
   */
  async findByCode(code: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { code },
    });

    if (!badge) {
      throw new NotFoundException(`Badge with code "${code}" not found`);
    }

    return badge;
  }

  /**
   * Get all badges for a user
   */
  async getUserBadges(userId: string) {
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

  /**
   * Award a badge to a user
   */
  async awardBadge(userId: string, badgeCode: string) {
    const badge = await this.findByCode(badgeCode);

    // Check if user already has this badge
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

  /**
   * Remove a badge from a user
   */
  async revokeBadge(userId: string, badgeCode: string) {
    const badge = await this.findByCode(badgeCode);

    await this.prisma.userBadge.deleteMany({
      where: {
        userId,
        badgeId: badge.id,
      },
    });

    return { message: 'Badge revoked successfully' };
  }

  /**
   * Seed default badges if they don't exist
   */
  async seedDefaultBadges() {
    for (const badge of DEFAULT_BADGES) {
      await this.prisma.badge.upsert({
        where: { code: badge.code },
        update: {},
        create: badge,
      });
    }

    return { message: `Seeded ${DEFAULT_BADGES.length} default badges` };
  }
}
