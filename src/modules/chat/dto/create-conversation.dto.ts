import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ConversationType {
  DM = 'dm',
  GROUP = 'group',
}

export class CreateConversationDto {
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;
}
