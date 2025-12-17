import { JourneyStatus } from '@prisma/client';
export declare class CreateJourneyDto {
    origin?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    tripType?: string;
    title?: string;
    description?: string;
    status?: JourneyStatus;
}
