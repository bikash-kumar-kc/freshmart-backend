import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { PasswordResetProcessor } from './processors/send-magiical-url.processor';
import { VendorModule } from '../vendor/vendor.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    BullModule.registerQueue({ name: 'send-magical-url' }),
    VendorModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordResetProcessor],
})
export class AuthModule {}
