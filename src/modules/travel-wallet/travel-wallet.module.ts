import { Module } from '@nestjs/common';
import { TravelWalletController } from './travel-wallet.controller';
import { TravelWalletService } from './travel-wallet.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [TravelWalletController],
  providers: [TravelWalletService],
  exports: [TravelWalletService],
})
export class TravelWalletModule {}
