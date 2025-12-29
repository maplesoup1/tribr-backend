import { PrismaService } from '../../prisma/prisma.service';
export declare class ChatService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listConversations(userId: string): Promise<({
        participants: ({
            user: {
                profile: {
                    userId: string;
                    fullName: string | null;
                    avatarUrl: string | null;
                    visibility: import(".prisma/client").$Enums.Visibility;
                    verificationLevel: number;
                    gender: string | null;
                    birthDate: Date | null;
                    city: string | null;
                    country: string | null;
                    archetypes: string[];
                    interests: string[];
                    travelStyles: string[];
                    bio: string | null;
                    username: string | null;
                    instagramHandle: string | null;
                    tiktokHandle: string | null;
                    youtubeUrl: string | null;
                    videoIntroUrl: string | null;
                } | null;
            } & {
                id: string;
                phone: string | null;
                countryCode: string;
                email: string;
                onboardingComplete: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            conversationId: string;
            userId: string;
            role: import(".prisma/client").$Enums.ParticipantRole;
            lastReadAt: Date | null;
            joinedAt: Date;
        })[];
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
    markAsRead(userId: string, conversationId: string): Promise<void>;
    createConversation(userId: string, participantIds: string[], type?: 'dm' | 'group', title?: string, metadata?: any): Promise<{
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
    deleteMessage(userId: string, conversationId: string, messageId: string): Promise<{
        message: string;
    }>;
    deleteConversation(userId: string, conversationId: string): Promise<{
        message: string;
    }>;
    removeParticipant(userId: string, conversationId: string, targetUserId: string): Promise<{
        message: string;
    }>;
    private ensureParticipant;
}
