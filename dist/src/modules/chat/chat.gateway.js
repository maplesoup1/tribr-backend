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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
const supabase_service_1 = require("../../supabase/supabase.service");
const common_1 = require("@nestjs/common");
let ChatGateway = class ChatGateway {
    chatService;
    supabaseService;
    server;
    logger = new common_1.Logger('ChatGateway');
    constructor(chatService, supabaseService) {
        this.chatService = chatService;
        this.supabaseService = supabaseService;
    }
    async handleConnection(client) {
        try {
            const authHeader = client.handshake.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
                throw new common_1.UnauthorizedException('No token provided');
            }
            const user = await this.supabaseService.verifyToken(token);
            client.data.user = user;
            client.join(`user_${user.id}`);
            this.logger.log(`Client connected: ${client.id}, User: ${user.id}`);
        }
        catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleJoinConversation(client, conversationId) {
        const userId = client.data.user.id;
        try {
            await this.chatService.getMessages(userId, conversationId, 1);
            client.join(`conversation_${conversationId}`);
            this.logger.log(`User ${userId} joined conversation ${conversationId}`);
            return { event: 'joinedConversation', data: { conversationId } };
        }
        catch (error) {
            return { event: 'error', data: error.message };
        }
    }
    handleLeaveConversation(client, conversationId) {
        client.leave(`conversation_${conversationId}`);
        return { event: 'leftConversation', data: { conversationId } };
    }
    async handleSendMessage(client, payload) {
        const userId = client.data.user.id;
        try {
            const message = await this.chatService.sendMessage(userId, payload.conversationId, payload.content);
            this.server
                .to(`conversation_${payload.conversationId}`)
                .emit('newMessage', message);
            return message;
        }
        catch (error) {
            return { event: 'error', data: error.message };
        }
    }
    async handleMarkAsRead(client, conversationId) {
        const userId = client.data.user.id;
        await this.chatService.markAsRead(userId, conversationId);
        client.to(`conversation_${conversationId}`).emit('messagesRead', {
            conversationId,
            userId,
            readAt: new Date().toISOString(),
        });
        return { success: true };
    }
    handleTyping(client, payload) {
        const userId = client.data.user.id;
        client.to(`conversation_${payload.conversationId}`).emit('userTyping', {
            conversationId: payload.conversationId,
            userId,
            isTyping: payload.isTyping,
        });
        return { success: true };
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinConversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveConversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markAsRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: 'chat',
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        supabase_service_1.SupabaseService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map