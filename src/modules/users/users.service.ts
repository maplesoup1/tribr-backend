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

  /**
   * Normalize phone to avoid unique constraint collisions.
   * - Trim whitespace
   * - Treat empty strings as undefined (so we don't write "" into a unique column)
   */
  private normalizePhone(phone?: string): string | undefined {
    const trimmed = phone?.trim();
    return trimmed ? trimmed : undefined;
  }

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
      travelStyles,
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
      travelStyles !== undefined ||
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
              ...(travelStyles !== undefined && { travelStyles }),
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
    const phone = this.normalizePhone(data.phone);

    // Step 1: Create user WITHOUT nested profile (avoids P2002 errors)
    const user = await this.prisma.user.create({
      data: {
        ...(phone && { phone }),
        countryCode: data.countryCode || '+1',
        email: data.email,
      },
    });

    // Step 2: Create profile separately
    await this.prisma.profile.create({
      data: {
        userId: user.id,
        fullName: data.fullName,
      },
    });

    // Step 3: Return user with profile included (non-null assertion safe here)
    return this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { profile: true },
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
    travelStyles?: string[];
  }) {
    if (!data.email) {
      throw new BadRequestException('Email is required');
    }

    const phone = this.normalizePhone(data.phone);

    // Step 1: Upsert user WITHOUT nested profile (avoids P2002 errors)
    const user = await this.prisma.user.upsert({
      where: { email: data.email },
      update: {
        ...(phone !== undefined && { phone }),
        ...(data.countryCode && { countryCode: data.countryCode }),
      },
      create: {
        ...(phone && { phone }),
        countryCode: data.countryCode || '+1',
        email: data.email,
      },
    });

    // Step 2: Upsert profile separately
    await this.prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.travelStyles !== undefined && { travelStyles: data.travelStyles }),
      },
      create: {
        userId: user.id,
        fullName: data.fullName,
        travelStyles: data.travelStyles ?? [],
      },
    });

    // Step 3: Return user with profile included (non-null assertion safe here)
    return this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { profile: true },
    });
  }

  /**
   * Resolve internal user from Supabase user payload, create if missing.
   * Uses Supabase Auth UID as the user ID for consistency.
   */
  async getOrCreateFromSupabaseUser(supabaseUser: any) {
    const email = supabaseUser?.email;
    const authUid = supabaseUser?.id || supabaseUser?.sub;

    if (!email) {
      throw new BadRequestException('Email is required from Supabase user');
    }

    if (!authUid) {
      throw new BadRequestException('User ID is required from Supabase user');
    }

    const phone = this.normalizePhone(supabaseUser?.phone);
    const fullName = supabaseUser?.user_metadata?.full_name;

    return this.upsertUserWithId({
      id: authUid,
      phone,
      email,
      fullName,
    });
  }

  /**
   * Upsert user with explicit ID (used when we want to match Supabase Auth UID)
   */
  private async upsertUserWithId(data: {
    id: string;
    email: string;
    phone?: string;
    countryCode?: string;
    fullName?: string;
  }) {
    const phone = this.normalizePhone(data.phone);

    // Try to find by ID first, then by email
    const existingById = await this.prisma.user.findUnique({
      where: { id: data.id },
    });

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    let user: { id: string; email: string; phone: string | null; countryCode: string };

    if (existingById) {
      // User exists with this ID, update it
      user = await this.prisma.user.update({
        where: { id: data.id },
        data: {
          ...(phone !== undefined && { phone }),
          ...(data.countryCode && { countryCode: data.countryCode }),
        },
      });
    } else if (existingByEmail) {
      // User exists with this email but different ID - update the ID
      // This handles migration from old auto-generated IDs to Auth UIDs
      user = await this.prisma.user.update({
        where: { email: data.email },
        data: {
          id: data.id,
          ...(phone !== undefined && { phone }),
          ...(data.countryCode && { countryCode: data.countryCode }),
        },
      });
    } else {
      // Create new user with the specified ID
      user = await this.prisma.user.create({
        data: {
          id: data.id,
          email: data.email,
          ...(phone && { phone }),
          countryCode: data.countryCode || '+1',
        },
      });
    }

    // Upsert profile
    await this.prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
      },
      create: {
        userId: user.id,
        fullName: data.fullName,
        travelStyles: [],
      },
    });

    return this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { profile: true },
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

    // Upsert profile with avatar URL (handles both existing and missing profile)
    await this.prisma.profile.upsert({
      where: { userId },
      update: { avatarUrl },
      create: { userId, avatarUrl },
    });

    // Fetch updated user with profile
    const updatedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
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
   * Update user location using PostGIS
   */
  async updateLocation(
    userId: string,
    latitude: number,
    longitude: number,
    privacy?: string,
  ) {
    // Use raw query to handle PostGIS geography type
    await this.prisma.$executeRaw`
      INSERT INTO user_locations ("userId", location, "updatedAt", privacy)
      VALUES (
        ${userId},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        NOW(),
        COALESCE(${privacy}::"Visibility", 'connections'::"Visibility")
      )
      ON CONFLICT ("userId") DO UPDATE SET
        location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        "updatedAt" = NOW(),
        privacy = COALESCE(${privacy}::"Visibility", user_locations.privacy)
    `;

    return { message: 'Location updated successfully' };
  }

  async findNearby(
    currentUserId: string,
    latitude: number,
    longitude: number,
    radiusKm = 50,
    limit = 20,
  ) {
    const radiusMeters = Math.max(1, Math.min(radiusKm, 5000)) * 1000;
    const safeLimit = Math.max(1, Math.min(limit, 200));

    const results = await this.prisma.$queryRaw<
      Array<{
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
        city: string | null;
        country: string | null;
        latitude: number;
        longitude: number;
        distance: number;
        updatedAt: Date;
      }>
    >`
      SELECT
        u.id,
        p."fullName",
        p."avatarUrl",
        p.city,
        p.country,
        ul."updatedAt",
        ST_Y(ul.location::geometry) AS latitude,
        ST_X(ul.location::geometry) AS longitude,
        ST_Distance(
          ul.location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) AS distance
      FROM user_locations ul
      JOIN users u ON u.id = ul."userId"
      LEFT JOIN profiles p ON p."userId" = u.id
      WHERE
        u.id <> ${currentUserId}
        AND ul.location IS NOT NULL
        AND (
          ul.privacy = 'public'
          OR (
            ul.privacy = 'connections' AND EXISTS (
              SELECT 1 FROM connections c
              WHERE c.status = 'accepted'
                AND (
                  (c."userA" = ${currentUserId} AND c."userB" = u.id)
                  OR
                  (c."userB" = ${currentUserId} AND c."userA" = u.id)
                )
            )
          )
        )
        AND ST_DWithin(
          ul.location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance ASC
      LIMIT ${safeLimit}
    `;

    return results;
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
