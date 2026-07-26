import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [BullModule.registerQueue({ name: 'otp-email' })],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
