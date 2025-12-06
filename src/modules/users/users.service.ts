import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
    const { fullName, photoUrl, archetypes, interests, bio, ...userFields } = updateUserDto;

    // Build profile update object only if profile fields are present
    const hasProfileUpdates = fullName !== undefined || photoUrl !== undefined ||
                               archetypes !== undefined || interests !== undefined ||
                               bio !== undefined;

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
}
