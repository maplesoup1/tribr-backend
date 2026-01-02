import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

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
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      const userId = decodedToken.uid;

      if (!userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Attach user object to request
      request.user = {
        id: userId,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Token verification error:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
