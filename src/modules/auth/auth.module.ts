import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseModule } from '../../firebase/firebase.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, FirebaseModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
