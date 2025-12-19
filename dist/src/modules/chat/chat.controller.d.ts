import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    createConversation(req: any, dto: CreateConversationDto): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ConversationType;
        title: string | null;
        ownerId: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listConversations(req: any): Promise<({
        participants: {
            conversationId: string;
            userId: string;
            role: import(".prisma/client").$Enums.ParticipantRole;
            lastReadAt: Date | null;
            joinedAt: Date;
        }[];
        lastMessage: {
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
        } | null;
    } & {
        id: string;
        type: import(".prisma/client").$Enums.ConversationType;
        title: string | null;
        ownerId: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getMessages(req: any, conversationId: string, take?: number): Promise<{
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
    }[]>;
    sendMessage(req: any, conversationId: string, dto: SendMessageDto): Promise<{
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
    }>;
    markAsRead(req: any, conversationId: string): Promise<{
        success: boolean;
    }>;
    deleteMessage(req: any, conversationId: string, messageId: string): Promise<{
        message: string;
    }>;
}
