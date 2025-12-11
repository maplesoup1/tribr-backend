import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SupabaseService } from '../../supabase/supabase.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly supabaseService;
    server: Server;
    private logger;
    constructor(chatService: ChatService, supabaseService: SupabaseService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinConversation(client: Socket, conversationId: string): Promise<{
        event: string;
        data: any;
    }>;
    handleLeaveConversation(client: Socket, conversationId: string): {
        event: string;
        data: {
            conversationId: string;
        };
    };
    handleSendMessage(client: Socket, payload: {
        conversationId: string;
        content: string;
    }): Promise<{
        id: string;
        conversationId: string;
        senderId: string;
        type: import(".prisma/client").$Enums.MessageType;
        content: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isEdited: boolean;
        createdAt: Date;
        deletedAt: Date | null;
        deletedBy: string | null;
        journeyId: string | null;
    } | {
        event: string;
        data: any;
    }>;
    handleMarkAsRead(client: Socket, conversationId: string): Promise<{
        success: boolean;
    }>;
    handleTyping(client: Socket, payload: {
        conversationId: string;
        isTyping: boolean;
    }): {
        success: boolean;
    };
}
