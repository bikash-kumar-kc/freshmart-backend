import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { BullModule } from '@nestjs/bullmq';
import { VendorController } from './vendor.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'otp-email' })],
  controllers: [VendorController],
  providers: [VendorService],
})
export class VendorModule {}
