import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BadgesService } from './badges.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('badges')
export class BadgesController {
  constructor(
    private readonly badgesService: BadgesService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Get all available badges
   */
  @Get()
  async findAll() {
    return this.badgesService.findAll();
  }

  /**
   * Get current user's badges
   */
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getMyBadges(@Request() req) {
    const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.badgesService.getUserBadges(user.id);
  }

  /**
   * Seed default badges (for admin/setup)
   */
  @Post('seed')
  async seedBadges() {
    return this.badgesService.seedDefaultBadges();
  }
}
