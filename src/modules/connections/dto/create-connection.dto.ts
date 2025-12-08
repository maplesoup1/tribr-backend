import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ConnectionStatus } from '@prisma/client';

export class CreateConnectionDto {
  // userA is determined from authenticated user - not client input

  @IsUUID('4', { message: 'userB must be a valid UUID' })
  @IsNotEmpty()
  userB!: string;

  @IsOptional()
  @IsEnum(ConnectionStatus)
  status?: ConnectionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;
}
