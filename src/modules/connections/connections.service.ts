import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { ConnectionStatus } from '@prisma/client';

@Injectable()
export class ConnectionsService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureNotSelf(userA: string, userB: string) {
    if (userA === userB) {
      throw new BadRequestException('Cannot connect to yourself');
    }
  }

  async create(currentUserId: string, dto: CreateConnectionDto) {
    const rawA = currentUserId;
    const rawB = dto.userB;
    this.ensureNotSelf(rawA, rawB);
    // Enforce ordering to satisfy DB constraint check_user_a_less_than_user_b
    const [userA, userB] = rawA < rawB ? [rawA, rawB] : [rawB, rawA];

    // Block check: prevent connecting with someone you block/are blocked by
    const blocked = await this.prisma.userBlock.count({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
    });
    if (blocked > 0) {
      throw new BadRequestException(
        'Connection not allowed due to block settings',
      );
    }

    try {
      return await this.prisma.connection.create({
        data: {
          userA,
          userB,
          status: dto.status ?? ConnectionStatus.pending,
          source: dto.source,
        },
      });
    } catch (error: any) {
      // Handle specific Prisma error codes
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Connection already exists between these users',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('One or both users do not exist');
      }
      if (error.code === 'P2023') {
        throw new BadRequestException('Invalid user ID format');
      }
      if (error.code === 'P2010') {
        // CHECK constraint violation (userA < userB or userA != userB)
        throw new BadRequestException(
          'Invalid connection: users must be different',
        );
      }
      // Log unexpected errors for debugging
      console.error('Connection creation error:', error);
      throw new BadRequestException('Unable to create connection');
    }
  }

  async listByUser(
    userId: string,
    status?: ConnectionStatus,
    take: number = 50,
    skip: number = 0,
  ) {
    // Limit to max 100 per page to prevent DoS
    const limit = Math.min(take, 100);

    return this.prisma.connection.findMany({
      where: {
        // Only include status filter if provided
        ...(status && { status }),
        OR: [{ userA: userId }, { userB: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  async updateStatus(
    id: string,
    status: ConnectionStatus,
    currentUserId: string,
  ) {
    const connection = await this.prisma.connection.findUnique({
      where: { id },
    });
    if (!connection) {
      throw new BadRequestException('Connection not found');
    }
    // Only participants can update
    if (
      connection.userA !== currentUserId &&
      connection.userB !== currentUserId
    ) {
      throw new ForbiddenException();
    }

    // Enforce simple state machine: pending -> accepted/declined; accepted stays accepted
    if (
      connection.status === ConnectionStatus.accepted &&
      status !== ConnectionStatus.accepted
    ) {
      throw new BadRequestException(
        'Accepted connections cannot change status',
      );
    }
    if (connection.status === ConnectionStatus.pending) {
      if (
        ![ConnectionStatus.accepted, ConnectionStatus.pending].includes(status)
      ) {
        throw new BadRequestException('Invalid status transition');
      }
      // If current user is not userB (requestee), block accept
      if (
        status === ConnectionStatus.accepted &&
        connection.userB !== currentUserId
      ) {
        throw new ForbiddenException(
          'Only the recipient can accept the connection',
        );
      }
    }

    return this.prisma.connection.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string, currentUserId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id },
    });
    if (!connection) {
      throw new BadRequestException('Connection not found');
    }
    if (
      connection.userA !== currentUserId &&
      connection.userB !== currentUserId
    ) {
      throw new ForbiddenException();
    }
    return this.prisma.connection.delete({ where: { id } });
  }
}
