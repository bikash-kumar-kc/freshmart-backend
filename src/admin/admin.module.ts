import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { BullModule } from '@nestjs/bullmq';
import { AdminDashboardController } from './dashboard/dashboard.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'otp-email' })],
  controllers: [AdminController, AdminDashboardController],
  providers: [AdminService],
})
export class AdminModule {}
