import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private anonClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );
    const anonKey = this.configService.get<string>('supabase.anonKey');

    if (!supabaseUrl || !supabaseKey) {
      throw new InternalServerErrorException(
        'Supabase URL and Service Role Key must be provided',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Anon client for user-facing auth operations (OTP verification)
    if (anonKey) {
      this.anonClient = createClient(supabaseUrl, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
      this.anonClient = this.supabase;
    }
  }

  async onModuleInit() {
    await this.ensureStorageBuckets();
  }

  /**
   * Ensure required storage buckets exist
   */
  private async ensureStorageBuckets() {
    const buckets = [
      {
        name: 'avatars',
        options: {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
      },
      {
        name: 'profile-videos',
        options: {
          public: true,
          // Allow short intro videos; keep under CDN-friendly limit.
          fileSizeLimit: 200 * 1024 * 1024, // 200MB
          allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
        },
      },
      {
        name: 'wallet-documents',
        options: {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
          ],
        },
      },
    ];

    for (const bucket of buckets) {
      const { data: existingBucket } = await this.supabase.storage.getBucket(
        bucket.name,
      );

      if (!existingBucket) {
        const { error } = await this.supabase.storage.createBucket(
          bucket.name,
          bucket.options,
        );

        if (error && !error.message.includes('already exists')) {
          console.error(`Failed to create bucket ${bucket.name}:`, error);
        } else {
          console.log(`Storage bucket '${bucket.name}' ready`);
        }
      }
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get anon client for user-facing auth operations (OTP verification, sign-in)
   */
  getAnonClient(): SupabaseClient {
    return this.anonClient;
  }

  /**
   * Verify Supabase JWT token
   * @param token - JWT token from client
   * @returns User object from token payload
   */
  async verifyToken(token: string) {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return user;
  }
}
