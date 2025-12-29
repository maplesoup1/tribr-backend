import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: {
    activityId?: string;
    activityName?: string;
    activityEmoji?: string;
    connectionId?: string;
    conversationId?: string;
    fromUserId?: string;
    fromUserName?: string;
    fromUserAvatar?: string;
  };
}

export interface NoticeboardUpdate {
  id: string;
  type: 'meetup' | 'heading' | 'arrived';
  name: string;
  location: string;
  area: string;
  timeAgo: string;
  dateInfo: string;
  participants?: number;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new notification
   */
  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data as any,
      },
    });
  }

  /**
   * Get all notifications for a user
   */
  async findAllByUser(
    userId: string,
    options: {
      take?: number;
      skip?: number;
      unreadOnly?: boolean;
    } = {},
  ) {
    const { take = 50, skip = 0, unreadOnly = false } = options;
    const limit = Math.min(take, 100);

    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Get noticeboard updates (aggregated feed of network activity)
   */
  async getNoticeboard(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updates: NoticeboardUpdate[] = [];

    // 1. Get recent activities (meetups)
    // For now, get global recent public activities. In future, filter by location/network.
    const recentActivities = await this.prisma.activity.findMany({
      where: {
        privacy: 'open',
        status: 'active',
        date: {
          gte: today, // Upcoming (including today)
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        participants: true,
      },
    });

    // 2. Get recent journeys (heading to / arrived)
    const recentJourneys = await this.prisma.journey.findMany({
      where: {
        status: { in: ['active', 'draft'] }, // Simplified
        // Include own journeys for now so single-user dev environments still see updates.
        destination: { not: null },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // 3. Transform and merge
    // Map Activities to "meetup"
    for (const activity of recentActivities) {
      updates.push({
        id: `act_${activity.id}`,
        type: 'meetup',
        name: activity.description || 'Group Meetup',
        location: activity.locationText || 'Unknown Location',
        area: activity.locationText?.split(',')[0] || 'Nearby',
        timeAgo: 'Just now', // Simplified for demo, frontend calculates usually
        dateInfo: activity.date.toISOString().split('T')[0],
        participants: activity.participants.length,
        createdAt: activity.createdAt,
        user: {
          id: activity.creator.id,
          name: activity.creator.profile?.fullName || 'Tribr User',
          avatar: activity.creator.profile?.avatarUrl,
        },
      });
    }

    // Map Journeys to "heading" or "arrived"
    for (const journey of recentJourneys) {
      const isArrived = journey.startDate && new Date(journey.startDate) <= new Date();
      updates.push({
        id: `jny_${journey.id}`,
        type: isArrived ? 'arrived' : 'heading',
        name: journey.user.profile?.fullName || 'Tribr User',
        location: journey.destination || 'Unknown',
        area: journey.destination?.split(',')[0] || 'Unknown',
        timeAgo: 'Recently',
        dateInfo: journey.startDate ? new Date(journey.startDate).toDateString() : 'Soon',
        createdAt: journey.createdAt,
        user: {
          id: journey.user.id,
          name: journey.user.profile?.fullName || 'Tribr User',
          avatar: journey.user.profile?.avatarUrl,
        },
      });
    }

    // Sort by createdAt desc
    return updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id,
        userId, // Ensure user owns the notification
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete a notification
   */
  async delete(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  // =========================================
  // Helper methods for creating specific notification types
  // =========================================

  /**
   * Create notification when someone requests to join an activity
   */
  async notifyActivityJoinRequest(
    activityOwnerId: string,
    fromUser: { id: string; name: string; avatar?: string },
    activity: { id: string; description?: string; emoji?: string },
  ) {
    return this.create({
      userId: activityOwnerId,
      type: NotificationType.activity_join_request,
      title: `${fromUser.name} wants to join your activity`,
      body: activity.description,
      data: {
        activityId: activity.id,
        activityName: activity.description,
        activityEmoji: activity.emoji,
        fromUserId: fromUser.id,
        fromUserName: fromUser.name,
        fromUserAvatar: fromUser.avatar,
      },
    });
  }

  /**
   * Create notification when activity join request is approved
   */
  async notifyActivityRequestApproved(
    requesterId: string,
    activity: { id: string; description?: string; emoji?: string },
  ) {
    return this.create({
      userId: requesterId,
      type: NotificationType.activity_request_approved,
      title: 'Your join request was approved!',
      body: activity.description,
      data: {
        activityId: activity.id,
        activityName: activity.description,
        activityEmoji: activity.emoji,
      },
    });
  }

  /**
   * Create notification when someone sends a connection request
   */
  async notifyConnectionRequest(
    recipientId: string,
    fromUser: { id: string; name: string; avatar?: string },
    connectionId: string,
  ) {
    return this.create({
      userId: recipientId,
      type: NotificationType.connection_request,
      title: `${fromUser.name} wants to connect with you`,
      data: {
        connectionId,
        fromUserId: fromUser.id,
        fromUserName: fromUser.name,
        fromUserAvatar: fromUser.avatar,
      },
    });
  }

  /**
   * Create notification when connection request is accepted
   */
  async notifyConnectionAccepted(
    requesterId: string,
    acceptedBy: { id: string; name: string; avatar?: string },
    connectionId: string,
  ) {
    return this.create({
      userId: requesterId,
      type: NotificationType.connection_accepted,
      title: `${acceptedBy.name} accepted your connection request`,
      data: {
        connectionId,
        fromUserId: acceptedBy.id,
        fromUserName: acceptedBy.name,
        fromUserAvatar: acceptedBy.avatar,
      },
    });
  }

  /**
   * Create notification for new message
   */
  async notifyNewMessage(
    recipientId: string,
    fromUser: { id: string; name: string; avatar?: string },
    conversationId: string,
    messagePreview?: string,
  ) {
    return this.create({
      userId: recipientId,
      type: NotificationType.new_message,
      title: `${fromUser.name} sent you a message`,
      body: messagePreview,
      data: {
        conversationId,
        fromUserId: fromUser.id,
        fromUserName: fromUser.name,
        fromUserAvatar: fromUser.avatar,
      },
    });
  }

  /**
   * Create a system notification
   */
  async notifySystem(userId: string, title: string, body?: string) {
    return this.create({
      userId,
      type: NotificationType.system,
      title,
      body,
    });
  }
}
