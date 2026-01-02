import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

class SyncUserDto {
  idToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Sync user after Firebase client-side authentication
   * Client sends Firebase ID token, backend verifies and creates/updates local user
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncUser(@Body() dto: SyncUserDto) {
    return this.authService.verifyAndSyncUser(dto.idToken);
  }

  /**
   * Get current user info
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization header');
    }
    const token = authHeader.substring(7);
    return this.authService.getCurrentUser(token);
  }
}
