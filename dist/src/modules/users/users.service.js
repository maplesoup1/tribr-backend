"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const supabase_service_1 = require("../../supabase/supabase.service");
let UsersService = class UsersService {
    prisma;
    supabaseService;
    constructor(prisma, supabaseService) {
        this.prisma = prisma;
        this.supabaseService = supabaseService;
    }
    normalizePhone(phone) {
        const trimmed = phone?.trim();
        return trimmed ? trimmed : undefined;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async findByPhone(phone) {
        return this.prisma.user.findUnique({
            where: { phone },
        });
    }
    async findByEmail(email) {
        if (!email)
            return null;
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async update(id, updateUserDto) {
        await this.findById(id);
        const { fullName, photoUrl, archetypes, interests, travelStyles, bio, city, country, ...userFields } = updateUserDto;
        const hasProfileUpdates = fullName !== undefined ||
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
    async createUser(data) {
        const phone = this.normalizePhone(data.phone);
        const user = await this.prisma.user.create({
            data: {
                ...(phone && { phone }),
                countryCode: data.countryCode || '+1',
                email: data.email,
            },
        });
        await this.prisma.profile.create({
            data: {
                userId: user.id,
                fullName: data.fullName,
            },
        });
        return this.prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            include: { profile: true },
        });
    }
    async upsertUser(data) {
        if (!data.email) {
            throw new common_1.BadRequestException('Email is required');
        }
        const phone = this.normalizePhone(data.phone);
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
        return this.prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            include: { profile: true },
        });
    }
    async getOrCreateFromSupabaseUser(supabaseUser) {
        const email = supabaseUser?.email;
        const authUid = supabaseUser?.id || supabaseUser?.sub;
        if (!email) {
            throw new common_1.BadRequestException('Email is required from Supabase user');
        }
        if (!authUid) {
            throw new common_1.BadRequestException('User ID is required from Supabase user');
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
    async upsertUserWithId(data) {
        const phone = this.normalizePhone(data.phone);
        const existingById = await this.prisma.user.findUnique({
            where: { id: data.id },
        });
        const existingByEmail = await this.prisma.user.findUnique({
            where: { email: data.email },
        });
        let user;
        if (existingById) {
            user = await this.prisma.user.update({
                where: { id: data.id },
                data: {
                    ...(phone !== undefined && { phone }),
                    ...(data.countryCode && { countryCode: data.countryCode }),
                },
            });
        }
        else if (existingByEmail) {
            user = await this.prisma.user.update({
                where: { email: data.email },
                data: {
                    id: data.id,
                    ...(phone !== undefined && { phone }),
                    ...(data.countryCode && { countryCode: data.countryCode }),
                },
            });
        }
        else {
            user = await this.prisma.user.create({
                data: {
                    id: data.id,
                    email: data.email,
                    ...(phone && { phone }),
                    countryCode: data.countryCode || '+1',
                },
            });
        }
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
    async uploadAvatar(userId, file) {
        const supabase = this.supabaseService.getClient();
        const bucketName = 'avatars';
        const fileExt = file.originalname.split('.').pop() || 'jpg';
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
        });
        if (error) {
            console.error('Storage upload error:', error);
            throw new common_1.InternalServerErrorException('Failed to upload avatar');
        }
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);
        const avatarUrl = urlData.publicUrl;
        await this.prisma.profile.upsert({
            where: { userId },
            update: { avatarUrl },
            create: { userId, avatarUrl },
        });
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
    async getProfileWithStats(userId) {
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
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const connectionsCount = await this.prisma.connection.count({
            where: {
                OR: [{ userA: userId }, { userB: userId }],
                status: 'accepted',
            },
        });
        const tripsCount = await this.prisma.journey.count({
            where: {
                userId,
                status: 'completed',
            },
        });
        const trustScore = this.calculateTrustScore(user, connectionsCount, tripsCount);
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
    async updateLocation(userId, latitude, longitude, privacy) {
        await this.prisma.$executeRaw `
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
    async findNearby(currentUserId, latitude, longitude, radiusKm = 50, limit = 20) {
        const radiusMeters = Math.max(1, Math.min(radiusKm, 5000)) * 1000;
        const safeLimit = Math.max(1, Math.min(limit, 200));
        const results = await this.prisma.$queryRaw `
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
    calculateTrustScore(user, connections, trips) {
        let score = 0;
        const verificationLevel = user.profile?.verificationLevel || 0;
        if (verificationLevel >= 3) {
            score += 50;
        }
        else if (verificationLevel === 2) {
            score += 30;
        }
        else if (verificationLevel === 1) {
            score += 10;
        }
        score += Math.min(connections * 2, 25);
        score += Math.min(trips * 5, 25);
        return Math.min(score, 100);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        supabase_service_1.SupabaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map