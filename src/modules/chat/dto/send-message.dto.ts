import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  content: string;
}
