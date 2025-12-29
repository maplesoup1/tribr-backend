import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { ConnectionStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
      const connection = await this.prisma.connection.create({
        data: {
          userA,
          userB,
          requesterId: currentUserId, // Explicitly track who initiated
          status: dto.status ?? ConnectionStatus.pending,
          source: dto.source,
        },
      });

      // Send notification to recipient (the one who is NOT the requester)
      if (connection.status === ConnectionStatus.pending) {
        // Get sender's profile for notification
        const senderProfile = await this.prisma.profile.findUnique({
          where: { userId: currentUserId },
        });

        // The recipient is the other user in the pair
        const recipientId = userA === currentUserId ? userB : userA;

        await this.notificationsService.notifyConnectionRequest(
          recipientId,
          {
            id: currentUserId,
            name: senderProfile?.fullName || 'Someone',
            avatar: senderProfile?.avatarUrl ?? undefined,
          },
          connection.id,
        );
      }

      return connection;
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

    // Raw query to include distance between current user and counterpart, if locations exist
    const statusFilter = status
      ? Prisma.sql`AND c.status = ${status}::"ConnectionStatus"`
      : Prisma.sql``;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        status: ConnectionStatus;
        createdAt: Date;
        requesterId: string | null;
        otherUserId: string;
        fullName: string | null;
        avatarUrl: string | null;
        city: string | null;
        country: string | null;
        distance_meters: number | null;
      }>
    >(Prisma.sql`
      WITH current_loc AS (
        SELECT location FROM user_locations WHERE "userId" = ${userId}::text
      )
      SELECT
        c.id,
        c.status,
        c."createdAt",
        c."requesterId",
        CASE WHEN c."userA" = ${userId}::text THEN c."userB" ELSE c."userA" END AS "otherUserId",
        p."fullName",
        p."avatarUrl",
        p.city,
        p.country,
        CASE
          WHEN (SELECT location FROM current_loc) IS NULL THEN NULL
          WHEN ul.location IS NULL THEN NULL
          ELSE ST_Distance(ul.location, (SELECT location FROM current_loc))
        END AS distance_meters
      FROM connections c
      JOIN users u ON u.id = CASE WHEN c."userA" = ${userId}::text THEN c."userB" ELSE c."userA" END
      LEFT JOIN profiles p ON p."userId" = u.id
      LEFT JOIN user_locations ul ON ul."userId" = u.id
      WHERE
        (c."userA" = ${userId}::text OR c."userB" = ${userId}::text)
        ${statusFilter}
      ORDER BY c."createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `);

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt,
      direction: row.requesterId === userId ? 'outgoing' : 'incoming', // Identify direction!
      otherUser: {
        id: row.otherUserId,
        name: row.fullName || 'Traveler',
        avatar: row.avatarUrl || undefined,
        city: row.city || undefined,
        country: row.country || undefined,
      },
      distanceKm:
        row.distance_meters != null
          ? Math.round((Number(row.distance_meters) / 1000) * 10) / 10
          : null,
    }));
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

    // Enforce state machine
    if (connection.status === ConnectionStatus.accepted) {
      throw new BadRequestException(
        'Accepted connections cannot change status',
      );
    }

    if (connection.status === ConnectionStatus.declined) {
      throw new BadRequestException(
        'Declined connections cannot be modified. Send a new request instead.',
      );
    }

    if (connection.status === ConnectionStatus.pending) {
      const allowedNext: ConnectionStatus[] = [
        ConnectionStatus.accepted,
        ConnectionStatus.declined,
      ];
      if (!allowedNext.includes(status)) {
        throw new BadRequestException('Invalid status transition');
      }

      // Determine who is the recipient (the one who didn't initiate)
      if (connection.requesterId) {
        // Robust check: requester cannot accept/decline their own request
        if (connection.requesterId === currentUserId) {
          throw new ForbiddenException(
            'You cannot accept/decline your own connection request',
          );
        }
      } else {
        // Legacy data without requesterId: allow either participant to accept/decline
        // This is a best-effort fallback - we can't reliably determine the original requester
        // Both participants are allowed to modify the connection status
        // (This is more permissive but avoids wrongly blocking legitimate recipients)
      }
    }

    const updatedConnection = await this.prisma.connection.update({
      where: { id },
      data: { status },
    });

    // Send notification when connection is accepted
    if (status === ConnectionStatus.accepted) {
      // Get the accepter's profile
      const accepterProfile = await this.prisma.profile.findUnique({
        where: { userId: currentUserId },
      });
      
      // Determine who to notify (the original requester)
      const recipientId = connection.requesterId 
        ? connection.requesterId 
        : (connection.userA === currentUserId ? connection.userB : connection.userA); // Fallback logic

      await this.notificationsService.notifyConnectionAccepted(
        recipientId,
        {
          id: currentUserId,
          name: accepterProfile?.fullName || 'Someone',
          avatar: accepterProfile?.avatarUrl ?? undefined,
        },
        updatedConnection.id,
      );
    }

    return updatedConnection;
  }

  /**
   * Decline a pending connection request
   */
  async decline(id: string, currentUserId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    if (connection.status !== ConnectionStatus.pending) {
      throw new BadRequestException('Only pending connections can be declined');
    }

    // Only the recipient can decline
    if (connection.requesterId) {
      if (connection.requesterId === currentUserId) {
        // Requester can "cancel" -> they should delete, not decline
        throw new ForbiddenException('You cannot decline your own request. Delete it instead.');
      }
    } else {
      // Legacy data without requesterId: allow either participant to decline
      // This is more permissive but avoids wrongly blocking legitimate recipients
      // due to the flawed userB assumption with alphabetical sorting
    }

    return this.prisma.connection.update({
      where: { id },
      data: { status: ConnectionStatus.declined },
    });
  }

  /**
   * Get pending connection requests for a user (where they are the recipient)
   * Returns normalized response with otherUser field for easier client consumption
   */
  async getPendingRequests(userId: string, take: number = 50, skip: number = 0) {
    const limit = Math.min(take, 100);

    const connections = await this.prisma.connection.findMany({
      where: {
        // Logic: I am part of the connection, AND I am NOT the requester
        OR: [
           { userA: userId },
           { userB: userId }
        ],
        requesterId: { not: userId }, // I am not the requester
        status: ConnectionStatus.pending,
      },
      include: {
        userARelation: {
          include: { profile: true },
        },
        userBRelation: {
           include: { profile: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });

    // Normalize response: determine which user is "the other person" (the requester)
    return connections.map((conn) => {
      const isUserA = conn.userA === userId;
      const otherUserRelation = isUserA ? conn.userBRelation : conn.userARelation;

      return {
        id: conn.id,
        status: conn.status,
        createdAt: conn.createdAt,
        otherUser: {
          id: otherUserRelation.id,
          name: otherUserRelation.profile?.fullName || 'Traveler',
          avatar: otherUserRelation.profile?.avatarUrl || undefined,
          city: otherUserRelation.profile?.city || undefined,
          country: otherUserRelation.profile?.country || undefined,
        },
      };
    });
  }

  async remove(id: string, currentUserId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id },
    });
    if (!connection) {
      throw new NotFoundException('Connection not found');
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