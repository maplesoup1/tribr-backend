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

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

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
  }

  async onModuleInit() {
    await this.ensureStorageBuckets();
  }

  /**
   * Ensure required storage buckets exist
   */
  private async ensureStorageBuckets() {
    const buckets = ['avatars'];

    for (const bucketName of buckets) {
      const { data: existingBucket } = await this.supabase.storage.getBucket(
        bucketName,
      );

      if (!existingBucket) {
        const { error } = await this.supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        });

        if (error && !error.message.includes('already exists')) {
          console.error(`Failed to create bucket ${bucketName}:`, error);
        } else {
          console.log(`Storage bucket '${bucketName}' ready`);
        }
      }
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
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
