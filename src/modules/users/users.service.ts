import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async findByEmail(email: string) {
    if (!email) return null;

    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    await this.findById(id);

    // Separate User fields from Profile fields
    const {
      fullName,
      photoUrl,
      archetypes,
      interests,
      bio,
      city,
      country,
      ...userFields
    } = updateUserDto;

    // Build profile update object only if profile fields are present
    const hasProfileUpdates =
      fullName !== undefined ||
      photoUrl !== undefined ||
      archetypes !== undefined ||
      interests !== undefined ||
      bio !== undefined ||
      city !== undefined ||
      country !== undefined;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...userFields,
        // Only update profile if there are profile fields
        ...(hasProfileUpdates && {
          profile: {
            update: {
              ...(fullName !== undefined && { fullName }),
              ...(photoUrl !== undefined && { avatarUrl: photoUrl }),
              ...(archetypes !== undefined && { archetypes }),
              ...(interests !== undefined && { interests }),
              ...(bio !== undefined && { bio }),
              ...(city !== undefined && { city }),
              ...(country !== undefined && { country }),
            },
          },
        }),
      },
      include: {
        profile: true,
      },
    });
  }

  async createUser(data: {
    phone?: string;
    countryCode?: string;
    email: string;
    fullName?: string;
  }) {
    return this.prisma.user.create({
      data: {
        phone: data.phone,
        countryCode: data.countryCode || '+1',
        email: data.email,
        // Create profile at the same time - fullName is on Profile model, not User
        profile: {
          create: {
            fullName: data.fullName,
          },
        },
      },
      include: {
        profile: true,
      },
    });
  }

  /**
   * Upsert user - create if doesn't exist, update if exists
   * Prevents race conditions during user creation
   * Uses email as unique identifier
   */
  async upsertUser(data: {
    phone?: string;
    countryCode?: string;
    email?: string;
    fullName?: string;
  }) {
    if (!data.email) {
      throw new BadRequestException('Email is required');
    }

    return this.prisma.user.upsert({
      where: { email: data.email },
      update: {
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.countryCode && { countryCode: data.countryCode }),
        // Upsert profile to handle both existing and new users
        profile: {
          upsert: {
            update: {
              fullName: data.fullName,
            },
            create: {
              fullName: data.fullName,
            },
          },
        },
      },
      create: {
        phone: data.phone,
        countryCode: data.countryCode || '+1',
        email: data.email,
        // Create profile at the same time
        profile: {
          create: {
            fullName: data.fullName,
          },
        },
      },
      include: {
        profile: true,
      },
    });
  }

  /**
   * Resolve internal user from Supabase user payload (by email), create if missing.
   * Email is required as unique identifier.
   */
  async getOrCreateFromSupabaseUser(supabaseUser: any) {
    const email = supabaseUser?.email;

    if (!email) {
      throw new BadRequestException('Email is required from Supabase user');
    }

    const phone = supabaseUser?.phone;
    const fullName = supabaseUser?.user_metadata?.full_name;

    return this.upsertUser({
      phone,
      email,
      fullName,
    });
  }

  /**
   * Upload avatar to Supabase Storage and update user profile
   */
  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const supabase = this.supabaseService.getClient();
    const bucketName = 'avatars';

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new InternalServerErrorException('Failed to upload avatar');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // Update user profile with avatar URL
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          update: {
            avatarUrl,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl,
      user: updatedUser,
    };
  }

  /**
   * Get user profile with statistics (trust score, trips count, connections count)
   */
  async getProfileWithStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        badges: {
          include: {
            badge: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Count accepted connections
    const connectionsCount = await this.prisma.connection.count({
      where: {
        OR: [{ userA: userId }, { userB: userId }],
        status: 'accepted',
      },
    });

    // Count completed journeys (trips)
    const tripsCount = await this.prisma.journey.count({
      where: {
        userId,
        status: 'completed',
      },
    });

    // Calculate trust score
    const trustScore = this.calculateTrustScore(
      user,
      connectionsCount,
      tripsCount,
    );

    // Format badges
    const badges = user.badges.map((ub) => ({
      code: ub.badge.code,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      earnedAt: ub.earnedAt,
    }));

    return {
      ...user,
      badges,
      stats: {
        trustScore,
        tripsCount,
        connectionsCount,
      },
    };
  }

  /**
   * Calculate trust score based on verification level, connections, and trips
   * Score range: 0-100
   */
  private calculateTrustScore(
    user: any,
    connections: number,
    trips: number,
  ): number {
    let score = 0;

    // Verification level contributes up to 50 points
    // Level 0 = 0, Level 1 = 10, Level 2 = 30, Level 3 = 50
    const verificationLevel = user.profile?.verificationLevel || 0;
    if (verificationLevel >= 3) {
      score += 50;
    } else if (verificationLevel === 2) {
      score += 30;
    } else if (verificationLevel === 1) {
      score += 10;
    }

    // Connections contribute up to 25 points (2 points per connection, max 25)
    score += Math.min(connections * 2, 25);

    // Trips contribute up to 25 points (5 points per trip, max 25)
    score += Math.min(trips * 5, 25);

    return Math.min(score, 100);
  }
}
