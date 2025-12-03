import { Injectable, NotFoundException } from '@nestjs/common';
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

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async completeOnboarding(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { onboardingComplete: true },
    });
  }

  async createUser(data: {
    phone: string;
    countryCode?: string;
    email?: string;
    fullName?: string;
  }) {
    return this.prisma.user.create({
      data: {
        phone: data.phone,
        countryCode: data.countryCode || '+1',
        email: data.email,
        fullName: data.fullName,
      },
    });
  }
}
