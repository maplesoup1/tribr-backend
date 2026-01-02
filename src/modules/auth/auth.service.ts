import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Verify Firebase ID token and sync user to local database
   * Called after client-side Firebase authentication
   */
  async verifyAndSyncUser(idToken: string) {
    try {
      // Verify the Firebase ID token
      const decodedToken = await this.firebaseService.verifyIdToken(idToken);

      if (!decodedToken.uid) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Get full user record from Firebase
      const firebaseUser = await this.firebaseService.getUser(decodedToken.uid);

      // Sync user to local database
      const user = await this.usersService.getOrCreateFromFirebaseUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        phoneNumber: firebaseUser.phoneNumber,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
      });

      return {
        message: 'User verified and synced successfully',
        user,
        firebaseUid: decodedToken.uid,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Auth verification error:', error);
      throw new BadRequestException('Failed to verify user. Please try again.');
    }
  }

  /**
   * Get current user info from token
   */
  async getCurrentUser(idToken: string) {
    try {
      const decodedToken = await this.firebaseService.verifyIdToken(idToken);

      if (!decodedToken.uid) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get user from local database
      const user = await this.usersService.getProfileWithStats(decodedToken.uid);

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to get user info');
    }
  }
}
