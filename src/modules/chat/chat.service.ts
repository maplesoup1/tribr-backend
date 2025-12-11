import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
