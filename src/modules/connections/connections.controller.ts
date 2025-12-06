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
  BadRequestException,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { ConnectionStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Controller('connections')
@UseGuards(SupabaseAuthGuard)
export class ConnectionsController {
  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateConnectionDto) {
    const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.connectionsService.create(currentUser.id, dto);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: ConnectionStatus,
    @Query('take') take?: number,
    @Query('skip') skip?: number,
  ) {
    const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.connectionsService.listByUser(
      currentUser.id,
      status,
      take ? +take : 50,
      skip ? +skip : 0,
    );
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Request() req, @Body() dto: UpdateConnectionDto) {
    if (!dto.status) {
      throw new BadRequestException('status field is required');
    }
    const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.connectionsService.updateStatus(id, dto.status, currentUser.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
    return this.connectionsService.remove(id, currentUser.id);
  }
}
