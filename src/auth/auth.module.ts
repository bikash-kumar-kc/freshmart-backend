import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    BullModule.registerQueue({ name: 'send-magical-url' }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
