import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from '../chat/chat.service';
export declare class ActivitiesService {
    private readonly prisma;
    private readonly notificationsService;
    private readonly chatService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, chatService: ChatService);
    private calculateAge;
    create(userId: string, dto: CreateActivityDto): Promise<{
        conversationId: string;
        participantsCount: number;
        isJoined: boolean;
        myStatus: import(".prisma/client").$Enums.ActivityParticipantStatus | undefined;
        myRole: import(".prisma/client").$Enums.ActivityParticipantRole | undefined;
        latitude: number;
        longitude: number;
        creator: {
            id: string;
            name: string;
            avatarUrl: string | null | undefined;
        };
        participants: {
            userId: string;
            name: string | null | undefined;
            avatarUrl: string | null | undefined;
        }[];
        id: string;
        creatorId: string;
        emoji: string | null;
        description: string | null;
        date: Date;
        timeType: import(".prisma/client").$Enums.ActivityTimeType;
        specificTime: Date | null;
        locationText: string | null;
        privacy: import(".prisma/client").$Enums.ActivityPrivacy;
        womenOnly: boolean;
        ageMin: number;
        ageMax: number;
        status: import(".prisma/client").$Enums.ActivityStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(userId: string, query: ActivityQueryDto): Promise<any[]>;
    findOne(userId: string, activityId: string): Promise<{
        participantsCount: number;
        conversationId: string | undefined;
        isJoined: boolean;
        myStatus: import(".prisma/client").$Enums.ActivityParticipantStatus | undefined;
        myRole: import(".prisma/client").$Enums.ActivityParticipantRole | undefined;
        latitude: number;
        longitude: number;
        creator: {
            id: string;
            name: string;
            avatarUrl: string | null | undefined;
        };
        participants: {
            userId: string;
            name: string | null | undefined;
            avatarUrl: string | null | undefined;
        }[];
        id: string;
        creatorId: string;
        emoji: string | null;
        description: string | null;
        date: Date;
        timeType: import(".prisma/client").$Enums.ActivityTimeType;
        specificTime: Date | null;
        locationText: string | null;
        privacy: import(".prisma/client").$Enums.ActivityPrivacy;
        womenOnly: boolean;
        ageMin: number;
        ageMax: number;
        status: import(".prisma/client").$Enums.ActivityStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    join(userId: string, activityId: string): Promise<{
        conversationId: string | undefined;
        activityTitle: string | null;
        activityId: string;
        userId: string;
        status: import(".prisma/client").$Enums.ActivityParticipantStatus;
        role: import(".prisma/client").$Enums.ActivityParticipantRole;
        joinedAt: Date;
    }>;
    leave(userId: string, activityId: string): Promise<{
        activityId: string;
        userId: string;
        status: import(".prisma/client").$Enums.ActivityParticipantStatus;
        role: import(".prisma/client").$Enums.ActivityParticipantRole;
        joinedAt: Date;
    }>;
    getParticipants(userId: string, activityId: string): Promise<({
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
        activityId: string;
        userId: string;
        status: import(".prisma/client").$Enums.ActivityParticipantStatus;
        role: import(".prisma/client").$Enums.ActivityParticipantRole;
        joinedAt: Date;
    })[]>;
    approveParticipant(hostUserId: string, activityId: string, participantUserId: string): Promise<{
        conversationId: string;
        activityId: string;
        userId: string;
        status: import(".prisma/client").$Enums.ActivityParticipantStatus;
        role: import(".prisma/client").$Enums.ActivityParticipantRole;
        joinedAt: Date;
    }>;
    rejectParticipant(hostUserId: string, activityId: string, participantUserId: string): Promise<{
        message: string;
    }>;
    getPendingParticipants(hostUserId: string, activityId: string): Promise<({
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
        activityId: string;
        userId: string;
        status: import(".prisma/client").$Enums.ActivityParticipantStatus;
        role: import(".prisma/client").$Enums.ActivityParticipantRole;
        joinedAt: Date;
    })[]>;
    getFeed(userId: string): Promise<{
        id: string;
        type: string;
        user: {
            name: string;
            avatar: string | null | undefined;
        };
        action: string;
        time: Date;
        metadata: {
            activityId: string;
        };
    }[]>;
}
