import { ConnectionStatus } from '@prisma/client';
export declare class CreateConnectionDto {
    userB: string;
    status?: ConnectionStatus;
    source?: string;
}
