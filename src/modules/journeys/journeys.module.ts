import { Module } from '@nestjs/common';
import { JourneysService } from './journeys.service';
import { JourneysController } from './journeys.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [JourneysController],
  providers: [JourneysService, PrismaService],
  exports: [JourneysService],
})
export class JourneysModule {}
