import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    create(req: any, createActivityDto: CreateActivityDto): Promise<{
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
    findAll(req: any, query: ActivityQueryDto): Promise<any[]>;
    getFeed(req: any): Promise<{
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
    findOne(req: any, id: string): Promise<{
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
    join(req: any, id: string): Promise<{
        conversationId: string | undefined;
        activityTitle: string | null;
        activityId: string;
        userId: string;
        status: import(".prisma/client").$Enums.ActivityParticipantStatus;
        role: import(".prisma/client").$Enums.ActivityParticipantRole;
        joinedAt: Date;
    }>;
    leave(req: any, id: string): Promise<{
        activityId: string;
        userId: string;
        status: import(".prisma/client").$Enums.ActivityParticipantStatus;
        role: import(".prisma/client").$Enums.ActivityParticipantRole;
        joinedAt: Date;
    }>;
    getParticipants(req: any, id: string): Promise<({
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
    getPendingParticipants(req: any, id: string): Promise<({
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
    approveParticipant(req: any, id: string, userId: string): Promise<{
        conversationId: string;
        activityId: string;
        userId: string;
        status: import(".prisma/client").$Enums.ActivityParticipantStatus;
        role: import(".prisma/client").$Enums.ActivityParticipantRole;
        joinedAt: Date;
    }>;
    rejectParticipant(req: any, id: string, userId: string): Promise<{
        message: string;
    }>;
}
