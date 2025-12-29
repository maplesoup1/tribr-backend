import { JourneyStatus, TransportMode } from '@prisma/client';
export declare class CreateJourneyDto {
    origin?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    tripType?: string;
    transport?: TransportMode;
    title?: string;
    description?: string;
    status?: JourneyStatus;
}
