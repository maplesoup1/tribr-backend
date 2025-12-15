import { Injectable, NotFoundException } from '@nestjs/common';
import { BadgeCategory, BadgeRarity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// All 21 badges aligned with web frontend
export const DEFAULT_BADGES: Array<{
  code: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirement: string;
}> = [
  // Exploration Badges (5)
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

  // Social Badges (4)
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

  // Adventure Badges (4)
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

  // Culture Badges (4)
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

  // Milestone Badges (4)
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

@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all available badges
   */
  async findAll(category?: BadgeCategory) {
    return this.prisma.badge.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { rarity: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get badge stats (total, by category, by rarity)
   */
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
   * Get all badges for a user with full details
   */
  async getUserBadges(userId: string) {
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

  /**
   * Get user's badge stats
   */
  async getUserBadgeStats(userId: string) {
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

  /**
   * Get all badges with user progress (for displaying full badge list with unlock status)
   */
  async getAllBadgesWithUserProgress(userId: string, category?: BadgeCategory) {
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
   * Update badge progress for a user
   */
  async updateProgress(userId: string, badgeCode: string, progress: number) {
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

    const data: any = {
      progress: safeProgress,
    };

    // Only set earnedAt if completing for the first time
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
        earnedAt: isCompleted ? new Date() : new Date(0), // Use epoch for not yet earned to satisfy schema if needed, or change schema to nullable
      },
    });

    return {
      ...userBadge,
      badge,
      unlocked: isCompleted,
    };
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
