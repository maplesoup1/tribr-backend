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
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take,
    });
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    await this.ensureParticipant(userId, conversationId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
      },
    });

    return message;
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

  async createConversation(userId: string, participantIds: string[], type: 'dm' | 'group' = 'dm') {
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

    // 4. Soft delete: set deletedAt and deletedBy
    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return { message: 'Message deleted' };
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
