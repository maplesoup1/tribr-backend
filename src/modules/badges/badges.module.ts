import { Module } from '@nestjs/common';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [BadgesController],
  providers: [BadgesService, PrismaService],
  exports: [BadgesService],
})
export class BadgesModule {}
