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
  Query,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { NearbyQueryDto } from './dto/nearby-query.dto';

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

  @Post('me/location')
  async updateLocation(
    @Request() req,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.usersService.updateLocation(
      user.id,
      updateLocationDto.latitude,
      updateLocationDto.longitude,
      updateLocationDto.privacy,
    );
  }

  @Post('me/video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type (video formats)
    const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only MP4, MOV, and WebM videos are allowed');
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 50MB');
    }

    const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.usersService.uploadVideo(user.id, file);
  }

  @Get('nearby')
  async getNearby(@Request() req, @Query() query: NearbyQueryDto) {
    const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.usersService.findNearby(
      user.id,
      query.latitude,
      query.longitude,
      query.radiusKm,
      query.limit,
    );
  }

  @Get('destination-stats')
  async getDestinationStats(@Query('location') location: string) {
    return this.usersService.getDestinationStats(location);
  }

  /**
   * Get another user's public profile by ID
   */
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getProfileWithStats(id);
  }
}
