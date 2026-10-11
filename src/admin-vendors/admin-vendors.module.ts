import { Module } from '@nestjs/common';
import { AdminVendorsService } from './admin-vendors.service';
import { AdminVendorsController } from './admin-vendors.controller';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [BullModule.registerQueue({ name: 'otp-email' })],
  controllers: [AdminVendorsController],
  providers: [AdminVendorsService],
})
export class AdminVendorsModule {}
