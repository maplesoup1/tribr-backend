import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: true,
        lastMessage: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(userId: string, conversationId: string, take = 50) {
    await this.ensureParticipant(userId, conversationId);
    return this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null, // Filter out soft-deleted messages
      },
      orderBy: { createdAt: 'asc' },
      take,
    });
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    await this.ensureParticipant(userId, conversationId);

    // Use transaction to ensure message creation and conversation update are atomic
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
        },
      });

      return message;
    });
  }

  async markAsRead(userId: string, conversationId: string) {
    await this.ensureParticipant(userId, conversationId);
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  async createConversation(
    userId: string,
    participantIds: string[],
    type: 'dm' | 'group' = 'dm',
    title?: string,
    metadata?: any,
  ) {
    // For DMs, check if one already exists
    if (type === 'dm' && participantIds.length === 1) {
      const otherUserId = participantIds[0];
      const existingConvo = await this.prisma.conversation.findFirst({
        where: {
          type: 'dm',
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: otherUserId } } },
          ],
        },
      });

      if (existingConvo) {
        return existingConvo;
      }
    }

    const allParticipants = [...new Set([userId, ...participantIds])];

    return this.prisma.conversation.create({
      data: {
        type,
        ownerId: userId,
        title,
        metadata,
        participants: {
          create: allParticipants.map((pid) => ({
            userId: pid,
            role: pid === userId ? 'owner' : 'member',
          })),
        },
      },
      include: {
        participants: true,
      },
    });
  }

  async deleteMessage(userId: string, conversationId: string, messageId: string) {
    // 1. Ensure user is participant of conversation
    await this.ensureParticipant(userId, conversationId);

    // 2. Find message and validate it belongs to this conversation
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.conversationId !== conversationId) {
      throw new BadRequestException('Message does not belong to this conversation');
    }

    // 3. Only allow sender to delete their own message
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Use transaction for atomicity
    return this.prisma.$transaction(async (tx) => {
      // 4. Soft delete: set deletedAt and deletedBy
      await tx.message.update({
        where: { id: messageId },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
        },
      });

      // 5. If this was the lastMessage, update conversation to point to previous non-deleted message
      const conversation = await tx.conversation.findUnique({
        where: { id: conversationId },
        select: { lastMessageId: true },
      });

      if (conversation?.lastMessageId === messageId) {
        // Find the most recent non-deleted message
        const previousMessage = await tx.message.findFirst({
          where: {
            conversationId,
            deletedAt: null,
            id: { not: messageId },
          },
          orderBy: { createdAt: 'desc' },
        });

        await tx.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageId: previousMessage?.id ?? null,
            lastMessageAt: previousMessage?.createdAt ?? null,
          },
        });
      }

      return { message: 'Message deleted' };
    });
  }

  async deleteConversation(userId: string, conversationId: string) {
    const convo = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { ownerId: true },
    });

    if (!convo) {
      throw new NotFoundException('Conversation not found');
    }
    if (convo.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete this conversation');
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { message: 'Conversation deleted' };
  }

  async removeParticipant(userId: string, conversationId: string, targetUserId: string) {
    const convo = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { ownerId: true },
    });

    if (!convo) {
      throw new NotFoundException('Conversation not found');
    }

    // Authorization: User can remove themselves OR owner can remove others
    const isSelfRemoval = userId === targetUserId;
    const isOwner = convo.ownerId === userId;

    if (!isSelfRemoval && !isOwner) {
      throw new ForbiddenException('Only the owner can remove other participants');
    }

    // Owner cannot remove themselves (would leave conversation orphaned)
    if (isSelfRemoval && isOwner) {
      throw new BadRequestException('Owner cannot leave the conversation. Transfer ownership or delete the conversation instead.');
    }

    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: targetUserId,
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    await this.prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId: targetUserId,
        },
      },
    });

    return { message: isSelfRemoval ? 'Left conversation' : 'Participant removed' };
  }

  private async ensureParticipant(userId: string, conversationId: string) {
    const convo = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!convo) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = convo.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }
  }
}
