import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(@Request() req) {
    const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.usersService.getProfileWithStats(user.id);
  }

  @Patch('me')
  async updateCurrentUser(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.usersService.update(user.id, updateUserDto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.usersService.uploadAvatar(user.id, file);
  }
}
