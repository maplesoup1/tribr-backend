import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(@Request() req) {
    // req.user is set by SupabaseAuthGuard
    const supabaseUser = req.user;

    // Find user in our database by phone or email
    let user = await this.usersService.findByPhone(supabaseUser.phone);

    if (!user && supabaseUser.email) {
      user = await this.usersService.findByEmail(supabaseUser.email);
    }

    // If user doesn't exist in our database, create them
    if (!user) {
      user = await this.usersService.createUser({
        phone: supabaseUser.phone || '',
        email: supabaseUser.email,
        fullName: supabaseUser.user_metadata?.full_name,
      });
    }

    return user;
  }

  @Patch('me')
  async updateCurrentUser(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const supabaseUser = req.user;

    // Get user from database
    let user = await this.usersService.findByPhone(supabaseUser.phone);

    if (!user && supabaseUser.email) {
      user = await this.usersService.findByEmail(supabaseUser.email);
    }

    if (!user) {
      throw new Error('User not found in database');
    }

    return this.usersService.update(user.id, updateUserDto);
  }
}
