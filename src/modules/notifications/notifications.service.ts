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
