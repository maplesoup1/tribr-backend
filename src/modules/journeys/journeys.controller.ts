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
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('journeys')
@UseGuards(SupabaseAuthGuard)
export class JourneysController {
  constructor(
    private readonly journeysService: JourneysService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateJourneyDto) {
    const currentUser = await this.usersService.getOrCreateFromSupabaseUser(
      req.user,
    );
    return this.journeysService.create(currentUser.id, dto);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('scope') scope?: 'self' | 'connections' | 'public',
    @Query('take') take?: number,
    @Query('skip') skip?: number,
  ) {
    const currentUser = await this.usersService.getOrCreateFromSupabaseUser(
      req.user,
    );
    return this.journeysService.findVisibleForUser(
      currentUser.id,
      scope,
      take ? +take : 20,
      skip ? +skip : 0,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const currentUser = await this.usersService.getOrCreateFromSupabaseUser(
      req.user,
    );
    return this.journeysService.findOne(id, currentUser.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJourneyDto,
    @Request() req,
  ) {
    const currentUser = await this.usersService.getOrCreateFromSupabaseUser(
      req.user,
    );
    return this.journeysService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const currentUser = await this.usersService.getOrCreateFromSupabaseUser(
      req.user,
    );
    return this.journeysService.remove(id, currentUser.id);
  }
}
