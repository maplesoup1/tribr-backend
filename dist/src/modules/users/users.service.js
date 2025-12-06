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
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
        const { fullName, photoUrl, archetypes, interests, bio, ...userFields } = updateUserDto;
        const hasProfileUpdates = fullName !== undefined || photoUrl !== undefined ||
            archetypes !== undefined || interests !== undefined ||
            bio !== undefined;
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map