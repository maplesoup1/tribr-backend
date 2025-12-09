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
        const { fullName, photoUrl, archetypes, interests, bio, city, country, ...userFields } = updateUserDto;
        const hasProfileUpdates = fullName !== undefined ||
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
    async createUser(data) {
        return this.prisma.user.create({
            data: {
                phone: data.phone,
                countryCode: data.countryCode || '+1',
                email: data.email,
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
    async upsertUser(data) {
        if (!data.email) {
            throw new common_1.BadRequestException('Email is required');
        }
        return this.prisma.user.upsert({
            where: { email: data.email },
            update: {
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.countryCode && { countryCode: data.countryCode }),
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
    async getOrCreateFromSupabaseUser(supabaseUser) {
        const email = supabaseUser?.email;
        if (!email) {
            throw new common_1.BadRequestException('Email is required from Supabase user');
        }
        const phone = supabaseUser?.phone;
        const fullName = supabaseUser?.user_metadata?.full_name;
        return this.upsertUser({
            phone,
            email,
            fullName,
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