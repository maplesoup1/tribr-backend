import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const user = await this.supabaseService.verifyToken(token);

      // Validate user data integrity
      if (!user || !user.id || !user.email) {
        throw new UnauthorizedException('Invalid user data in token');
      }

      request.user = user; // Attach user to request object
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Log the actual error for debugging (without exposing to client)
      console.error('Token verification error:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
