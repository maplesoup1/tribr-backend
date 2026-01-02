import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
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
      languages,
      username,
      instagramHandle,
      tiktokHandle,
      youtubeUrl,
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
      country !== undefined ||
      username !== undefined ||
      instagramHandle !== undefined ||
      tiktokHandle !== undefined ||
      youtubeUrl !== undefined;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Update user + profile
        await tx.user.update({
          where: { id },
          data: {
            ...userFields,
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
                  ...(username !== undefined && { username }),
                  ...(instagramHandle !== undefined && { instagramHandle }),
                  ...(tiktokHandle !== undefined && { tiktokHandle }),
                  ...(youtubeUrl !== undefined && { youtubeUrl }),
                },
              },
            }),
          },
        });

        // Upsert languages (replace set)
        if (languages !== undefined) {
          await tx.userLanguage.deleteMany({ where: { userId: id } });
          if (languages.length) {
            await tx.userLanguage.createMany({
              data: languages.map((lang) => ({
                userId: id,
                language: lang.language,
                level: lang.level,
              })),
            });
          }
        }

        return tx.user.findUniqueOrThrow({
          where: { id },
          include: { profile: true, languages: true, badges: { include: { badge: true } } },
        });
      });
    } catch (err: any) {
      // Unique constraint conflict on profile (username etc.)
      if (err?.code === 'P2002') {
        const target = (err.meta as any)?.target as string[] | undefined;
        const field = target?.[0];
        if (field === 'username') {
          throw new ConflictException('Username is already taken');
        }
        if (field === 'email') {
          throw new ConflictException('Email is already in use');
        }
        if (field === 'phone') {
          throw new ConflictException('Phone number is already in use');
        }
        throw new ConflictException('Resource already exists');
      }
      throw err;
    }
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
   * @deprecated Use getOrCreateFromFirebaseUser instead
   */
  // Legacy Supabase handler removed.

  /**
   * Resolve internal user from Firebase user payload, create if missing.
   * Uses Firebase Auth UID as the user ID for consistency.
   * Supports both email and phone-only users.
   */
  async getOrCreateFromFirebaseUser(firebaseUser: {
    uid: string;
    email?: string | null;
    phoneNumber?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    emailVerified?: boolean | null;
  }) {
    const { uid, phoneNumber, displayName, photoURL } = firebaseUser;

    if (!uid) {
      throw new BadRequestException('UID is required from Firebase user');
    }

    // Generate a stable fallback email for phone-only users to satisfy DB constraints.
    const normalizedEmail =
      firebaseUser.email || `phone_${uid}@tribr.local`;

    // Fast path: if user already exists, return without doing any writes
    const existing = await this.prisma.user.findUnique({
      where: { id: uid },
      include: { profile: true },
    });
    if (existing) {
      return existing;
    }

    // Create/upsert user with Firebase UID
    return this.upsertUserWithId({
      id: uid,
      email: normalizedEmail,
      phone: phoneNumber || undefined,
      fullName: displayName || undefined,
      photoUrl: photoURL || undefined,
    });
  }

  /**
   * Upsert user with explicit ID (used when we want to match Auth UID)
   * Supports both email-based and phone-based users.
   */
  private async upsertUserWithId(data: {
    id: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    fullName?: string;
    photoUrl?: string;
  }) {
    const phone = this.normalizePhone(data.phone);

    // Try to find by ID first
    const existingById = await this.prisma.user.findUnique({
      where: { id: data.id },
    });

    // Try to find by email if provided
    const existingByEmail = data.email
      ? await this.prisma.user.findUnique({ where: { email: data.email } })
      : null;

    // Try to find by phone if provided
    const existingByPhone = phone
      ? await this.prisma.user.findUnique({ where: { phone } })
      : null;

    let user: {
      id: string;
      email: string | null;
      phone: string | null;
      countryCode: string;
    };

    if (existingById) {
      // User exists with this ID, update it
      user = await this.prisma.user.update({
        where: { id: data.id },
        data: {
          ...(phone !== undefined && { phone }),
          ...(data.email !== undefined && { email: data.email }),
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
    } else if (existingByPhone) {
      // User exists with this phone but different ID - update the ID
      user = await this.prisma.user.update({
        where: { phone },
        data: {
          id: data.id,
          ...(data.email !== undefined && { email: data.email }),
          ...(data.countryCode && { countryCode: data.countryCode }),
        },
      });
    } else {
      // Create new user with the specified ID
      user = await this.prisma.user.create({
        data: {
          id: data.id,
          ...(data.email && { email: data.email }),
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
        ...(data.photoUrl !== undefined && { avatarUrl: data.photoUrl }),
      },
      create: {
        userId: user.id,
        fullName: data.fullName,
        avatarUrl: data.photoUrl,
        travelStyles: [],
      },
    });

    return this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { profile: true },
    });
  }

  /**
   * Upload avatar to GCS and update user profile
   */
  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const bucketName = this.storageService.getAvatarsBucket();

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const avatarUrl = await this.storageService.uploadPublicFile(
      bucketName,
      fileName,
      file.buffer,
      file.mimetype,
    );

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
    // Run profile fetch + counts in parallel to reduce latency
    const [user, connectionsCount, tripsCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          languages: true,
          badges: {
            include: {
              badge: true,
            },
          },
        },
      }),
      this.prisma.connection.count({
        where: {
          OR: [{ userA: userId }, { userB: userId }],
          status: 'accepted',
        },
      }),
      this.prisma.journey.count({
        where: {
          userId,
          status: 'completed',
        },
      }),
    ]);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

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
        AND ST_DWithin(
          ul.location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance ASC
      LIMIT ${safeLimit}
    `;

    return results.map((u) => ({
      id: u.id,
      name: u.fullName || 'User',
      avatar: u.avatarUrl,
      location: {
        latitude: u.latitude,
        longitude: u.longitude,
        city: u.city,
        country: u.country,
      },
      distance: `${Math.round((u.distance / 1000) * 10) / 10} km`,
    }));
  }

  /**
   * Upload video introduction to GCS and update user profile
   */
  async uploadVideo(userId: string, file: Express.Multer.File) {
    const bucketName = this.storageService.getProfileVideosBucket();

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop() || 'mp4';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const videoIntroUrl = await this.storageService.uploadPublicFile(
      bucketName,
      fileName,
      file.buffer,
      file.mimetype,
    );

    // Upsert profile with video URL
    await this.prisma.profile.upsert({
      where: { userId },
      update: { videoIntroUrl },
      create: { userId, videoIntroUrl },
    });

    // Fetch updated user with profile
    const updatedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    return {
      message: 'Video uploaded successfully',
      videoIntroUrl,
      user: updatedUser,
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

  /**
   * Get stats for a specific destination (Tribr counts)
   * Matches against Profile city/country and Journey destinations
   */
  async getDestinationStats(location: string) {
    if (!location) {
      return {
        location: '',
        currentCount: 0,
        incomingCount: 0,
        totalCount: 0,
        trending: false,
      };
    }

    // 1. Users currently there (based on Profile city/country)
    // Note: Ideally we would use UserLocation + Geocoding, but text match is a fallback
    const currentCount = await this.prisma.profile.count({
      where: {
        OR: [
          { city: { contains: location, mode: 'insensitive' } },
          { country: { contains: location, mode: 'insensitive' } },
        ],
      },
    });

    // 2. Users traveling there soon (Future Journeys)
    const today = new Date();

    // Get unique user IDs from journeys heading to this destination
    const incomingJourneys = await this.prisma.journey.findMany({
      where: {
        destination: { contains: location, mode: 'insensitive' },
        startDate: { gte: today },
        status: { in: ['draft', 'active'] },
      },
      select: { userId: true },
    });

    // Get unique user IDs from journey legs heading to this destination
    const incomingLegs = await this.prisma.journeyLeg.findMany({
      where: {
        destination: { contains: location, mode: 'insensitive' },
        startDate: { gte: today },
      },
      select: { journey: { select: { userId: true } } },
    });

    // Combine and deduplicate user IDs to get accurate incoming count
    const incomingUserIds = new Set<string>();
    incomingJourneys.forEach((j) => incomingUserIds.add(j.userId));
    incomingLegs.forEach((l) => {
      if (l.journey?.userId) {
        incomingUserIds.add(l.journey.userId);
      }
    });

    const incomingCount = incomingUserIds.size;
    const totalCount = currentCount + incomingCount;

    return {
      location,
      currentCount,
      incomingCount,
      totalCount,
      // Trending if significant activity (current or incoming)
      trending: totalCount > 5 || incomingCount > 3,
    };
  }
}
