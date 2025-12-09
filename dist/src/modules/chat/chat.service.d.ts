import { PrismaService } from '../../prisma/prisma.service';
export declare class ChatService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listConversations(userId: string): Promise<({
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
    getMessages(userId: string, conversationId: string, take?: number): Promise<{
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
    sendMessage(userId: string, conversationId: string, content: string): Promise<{
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
    private ensureParticipant;
}
