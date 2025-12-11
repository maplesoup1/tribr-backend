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
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take,
        });
    }
    async sendMessage(userId, conversationId, content) {
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
    async createConversation(userId, participantIds, type = 'dm') {
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