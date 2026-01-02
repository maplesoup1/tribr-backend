import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BadgesService } from './badges.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { UsersService } from '../users/users.service';
import { BadgeCategory } from '@prisma/client';

@Controller('badges')
export class BadgesController {
  constructor(
    private readonly badgesService: BadgesService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Get all available badges (optionally filtered by category)
   * GET /badges?category=exploration
   */
  @Get()
  async findAll(@Query('category') category?: BadgeCategory) {
    return this.badgesService.findAll(category);
  }

  /**
   * Get badge statistics
   * GET /badges/stats
   */
  @Get('stats')
  async getStats() {
    return this.badgesService.getStats();
  }

  /**
   * Get current user's earned badges
   * GET /badges/me
   */
  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMyBadges(@Request() req) {
    const user = await this.usersService.getOrCreateFromFirebaseUser({ uid: req.user.id, email: req.user.email, phoneNumber: req.user.phoneNumber });
    return this.badgesService.getUserBadges(user.id);
  }

  /**
   * Get current user's badge stats (unlocked count, percentage)
   * GET /badges/me/stats
   */
  @Get('me/stats')
  @UseGuards(FirebaseAuthGuard)
  async getMyBadgeStats(@Request() req) {
    const user = await this.usersService.getOrCreateFromFirebaseUser({ uid: req.user.id, email: req.user.email, phoneNumber: req.user.phoneNumber });
    return this.badgesService.getUserBadgeStats(user.id);
  }

  /**
   * Get all badges with current user's progress (for badge list page)
   * GET /badges/me/all?category=exploration
   */
  @Get('me/all')
  @UseGuards(FirebaseAuthGuard)
  async getAllWithMyProgress(
    @Request() req,
    @Query('category') category?: BadgeCategory,
  ) {
    const user = await this.usersService.getOrCreateFromFirebaseUser({ uid: req.user.id, email: req.user.email, phoneNumber: req.user.phoneNumber });
    return this.badgesService.getAllBadgesWithUserProgress(user.id, category);
  }

  /**
   * Seed default badges (for admin/setup)
   * POST /badges/seed
   * TODO: Restrict to ADMIN role only
   */
  @Post('seed')
  @UseGuards(FirebaseAuthGuard)
  async seedBadges() {
    // Ideally check for req.user.role === 'admin' here
    return this.badgesService.seedDefaultBadges();
  }

  /**
   * Update badge progress (for testing/admin or internal triggers)
   * POST /badges/:code/progress
   * Body: { "progress": 50 }
   */
  @Post(':code/progress')
  @UseGuards(FirebaseAuthGuard)
  async updateProgress(
    @Request() req,
    @Param('code') code: string,
    @Body('progress') progress: number,
  ) {
    const user = await this.usersService.getOrCreateFromFirebaseUser({ uid: req.user.id, email: req.user.email, phoneNumber: req.user.phoneNumber });
    return this.badgesService.updateProgress(user.id, code, progress);
  }
}
