import { ActivityTimeType, ActivityPrivacy } from '@prisma/client';
export declare class CreateActivityDto {
    emoji?: string;
    description: string;
    date: string;
    timeType: ActivityTimeType;
    specificTime?: string;
    locationText: string;
    latitude: number;
    longitude: number;
    privacy: ActivityPrivacy;
    womenOnly?: boolean;
    ageMin?: number;
    ageMax?: number;
}
