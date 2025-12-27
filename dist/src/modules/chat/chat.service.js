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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ChatService = class ChatService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listConversations(userId) {
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
    async getMessages(userId, conversationId, take = 50) {
        await this.ensureParticipant(userId, conversationId);
        return this.prisma.message.findMany({
            where: {
                conversationId,
                deletedAt: null,
            },
            orderBy: { createdAt: 'asc' },
            take,
        });
    }
    async sendMessage(userId, conversationId, content) {
        await this.ensureParticipant(userId, conversationId);
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
    async markAsRead(userId, conversationId) {
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
    async createConversation(userId, participantIds, type = 'dm', title, metadata) {
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
    async deleteMessage(userId, conversationId, messageId) {
        await this.ensureParticipant(userId, conversationId);
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (message.conversationId !== conversationId) {
            throw new common_1.BadRequestException('Message does not belong to this conversation');
        }
        if (message.senderId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own messages');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.message.update({
                where: { id: messageId },
                data: {
                    deletedAt: new Date(),
                    deletedBy: userId,
                },
            });
            const conversation = await tx.conversation.findUnique({
                where: { id: conversationId },
                select: { lastMessageId: true },
            });
            if (conversation?.lastMessageId === messageId) {
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
    async deleteConversation(userId, conversationId) {
        const convo = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { ownerId: true },
        });
        if (!convo) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        if (convo.ownerId !== userId) {
            throw new common_1.ForbiddenException('Only the owner can delete this conversation');
        }
        await this.prisma.conversation.delete({
            where: { id: conversationId },
        });
        return { message: 'Conversation deleted' };
    }
    async removeParticipant(userId, conversationId, targetUserId) {
        const convo = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { ownerId: true },
        });
        if (!convo) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const isSelfRemoval = userId === targetUserId;
        const isOwner = convo.ownerId === userId;
        if (!isSelfRemoval && !isOwner) {
            throw new common_1.ForbiddenException('Only the owner can remove other participants');
        }
        if (isSelfRemoval && isOwner) {
            throw new common_1.BadRequestException('Owner cannot leave the conversation. Transfer ownership or delete the conversation instead.');
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
            throw new common_1.NotFoundException('Participant not found');
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
    async ensureParticipant(userId, conversationId) {
        const convo = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { participants: true },
        });
        if (!convo) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const isParticipant = convo.participants.some((p) => p.userId === userId);
        if (!isParticipant) {
            throw new common_1.ForbiddenException('You are not a participant of this conversation');
        }
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map