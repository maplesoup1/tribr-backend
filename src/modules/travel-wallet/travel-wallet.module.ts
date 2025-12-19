import { Module } from '@nestjs/common';
import { TravelWalletController } from './travel-wallet.controller';
import { TravelWalletService } from './travel-wallet.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [TravelWalletController],
  providers: [TravelWalletService],
  exports: [TravelWalletService],
})
export class TravelWalletModule {}
