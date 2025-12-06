import { Module } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ConnectionsController],
  providers: [ConnectionsService, PrismaService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
