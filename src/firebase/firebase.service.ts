import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Initialize Firebase Admin with service account
    const serviceAccountPath =
      this.configService.get<string>('firebase.serviceAccountPath') ||
      './secrets/firebase-admin-backend.json';

    const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);

    try {
      // Check if Firebase is already initialized
      this.app = admin.app();
    } catch {
      // Initialize if not already done
      this.app = admin.initializeApp({
        credential: admin.credential.cert(resolvedPath),
      });
    }

    console.log('Firebase Admin initialized successfully');
  }

  /**
   * Verify Firebase ID token
   * @param idToken - Firebase ID token from client
   * @returns Decoded token with user info
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Firebase token verification error:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Get Firebase user by UID
   */
  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    return admin.auth().getUser(uid);
  }

  /**
   * Get Firebase Auth instance
   */
  getAuth(): admin.auth.Auth {
    return admin.auth();
  }
}
