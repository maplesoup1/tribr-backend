import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  async createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(
      req.user.id,
      dto.participantIds,
      dto.type as any,
    );
  }

  @Get('conversations')
  async listConversations(@Req() req: any) {
    return this.chatService.listConversations(req.user.id);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
  ) {
    return this.chatService.getMessages(req.user.id, conversationId, take);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, conversationId, dto.content);
  }

  @Post('conversations/:id/read')
  async markAsRead(@Req() req: any, @Param('id') conversationId: string) {
    await this.chatService.markAsRead(req.user.id, conversationId);
    return { success: true };
  }
}
