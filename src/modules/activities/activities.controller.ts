import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@UseGuards(FirebaseAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Req() req: any, @Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(req.user.id, createActivityDto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  findAll(@Req() req: any, @Query() query: ActivityQueryDto) {
    return this.activitiesService.findAll(req.user.id, query);
  }

  @Get('feed')
  getFeed(@Req() req: any) {
    return this.activitiesService.getFeed(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.activitiesService.findOne(req.user.id, id);
  }

  @Post(':id/join')
  join(@Req() req: any, @Param('id') id: string) {
    return this.activitiesService.join(req.user.id, id);
  }

  @Post(':id/leave')
  leave(@Req() req: any, @Param('id') id: string) {
    return this.activitiesService.leave(req.user.id, id);
  }

  @Get(':id/participants')
  getParticipants(@Req() req: any, @Param('id') id: string) {
    return this.activitiesService.getParticipants(req.user.id, id);
  }

  @Get(':id/participants/pending')
  getPendingParticipants(@Req() req: any, @Param('id') id: string) {
    return this.activitiesService.getPendingParticipants(req.user.id, id);
  }

  @Post(':id/participants/:userId/approve')
  approveParticipant(
    @Req() req: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.activitiesService.approveParticipant(req.user.id, id, userId);
  }

  @Post(':id/participants/:userId/reject')
  rejectParticipant(
    @Req() req: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.activitiesService.rejectParticipant(req.user.id, id, userId);
  }
}
