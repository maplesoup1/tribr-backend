import {
  Controller,
  Get,
  Post,
  Delete,
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
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@UseGuards(FirebaseAuthGuard)
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

  @Delete('conversations/:cid/messages/:mid')
  async deleteMessage(
    @Req() req: any,
    @Param('cid') conversationId: string,
    @Param('mid') messageId: string,
  ) {
    return this.chatService.deleteMessage(req.user.id, conversationId, messageId);
  }

  @Delete('conversations/:id')
  async deleteConversation(@Req() req: any, @Param('id') conversationId: string) {
    return this.chatService.deleteConversation(req.user.id, conversationId);
  }

  @Delete('conversations/:id/participants/:uid')
  async removeParticipant(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Param('uid') targetUserId: string,
  ) {
    return this.chatService.removeParticipant(req.user.id, conversationId, targetUserId);
  }
}
