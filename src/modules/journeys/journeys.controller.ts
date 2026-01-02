import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JourneysService } from './journeys.service';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('journeys')
@UseGuards(FirebaseAuthGuard)
export class JourneysController {
  constructor(
    private readonly journeysService: JourneysService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateJourneyDto) {
    const currentUser = await this.usersService.getOrCreateFromFirebaseUser({ uid: req.user.id, email: req.user.email, phoneNumber: req.user.phoneNumber });
    return this.journeysService.create(currentUser.id, dto);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('scope') scope?: 'self' | 'connections' | 'public',
    @Query('take') take?: number,
    @Query('skip') skip?: number,
  ) {
    const currentUser = await this.usersService.getOrCreateFromFirebaseUser({ uid: req.user.id, email: req.user.email, phoneNumber: req.user.phoneNumber });
    return this.journeysService.findVisibleForUser(
      currentUser.id,
      scope,
      take ? +take : 20,
      skip ? +skip : 0,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const currentUser = await this.usersService.getOrCreateFromFirebaseUser({ uid: req.user.id, email: req.user.email, phoneNumber: req.user.phoneNumber });
    return this.journeysService.findOne(id, currentUser.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJourneyDto,
    @Request() req,
  ) {
    const currentUser = await this.usersService.getOrCreateFromFirebaseUser({ uid: req.user.id, email: req.user.email, phoneNumber: req.user.phoneNumber });
    return this.journeysService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const currentUser = await this.usersService.getOrCreateFromFirebaseUser({ uid: req.user.id, email: req.user.email, phoneNumber: req.user.phoneNumber });
    return this.journeysService.remove(id, currentUser.id);
  }
}
