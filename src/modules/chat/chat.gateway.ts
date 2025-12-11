import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { Logger, UnauthorizedException } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  constructor(
    private readonly chatService: ChatService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const user = await this.supabaseService.verifyToken(token);
      client.data.user = user;
      
      // Join a room specific to the user for personal notifications/invites
      client.join(`user_${user.id}`);
      
      this.logger.log(`Client connected: ${client.id}, User: ${user.id}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.data.user.id;
    try {
      // Verify participation by fetching 1 message (or we could add a specific method)
      await this.chatService.getMessages(userId, conversationId, 1);
      
      client.join(`conversation_${conversationId}`);
      this.logger.log(`User ${userId} joined conversation ${conversationId}`);
      return { event: 'joinedConversation', data: { conversationId } };
    } catch (error) {
      return { event: 'error', data: error.message };
    }
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.leave(`conversation_${conversationId}`);
    return { event: 'leftConversation', data: { conversationId } };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; content: string },
  ) {
    const userId = client.data.user.id;
    try {
      const message = await this.chatService.sendMessage(
        userId,
        payload.conversationId,
        payload.content,
      );

      // Broadcast to room
      this.server
        .to(`conversation_${payload.conversationId}`)
        .emit('newMessage', message);
        
      return message;
    } catch (error) {
      return { event: 'error', data: error.message };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.data.user.id;
    await this.chatService.markAsRead(userId, conversationId);

    // Broadcast read status to other participants in the conversation
    client.to(`conversation_${conversationId}`).emit('messagesRead', {
      conversationId,
      userId,
      readAt: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.user.id;

    // Broadcast typing status to other participants
    client.to(`conversation_${payload.conversationId}`).emit('userTyping', {
      conversationId: payload.conversationId,
      userId,
      isTyping: payload.isTyping,
    });

    return { success: true };
  }
}
