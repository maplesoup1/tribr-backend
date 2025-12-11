import { Visibility } from '@prisma/client';
export declare class UpdateLocationDto {
    latitude: number;
    longitude: number;
    privacy?: Visibility;
}
