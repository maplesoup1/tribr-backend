import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  NotFoundException,
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
    return this.usersService.getOrCreateFromSupabaseUser(req.user);
  }

  @Patch('me')
  async updateCurrentUser(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.usersService.update(user.id, updateUserDto);
  }
}
