import { Module } from '@nestjs/common';
import { AdminVendorsService } from './admin-vendors.service';
import { AdminVendorsController } from './admin-vendors.controller';

@Module({
  controllers: [AdminVendorsController],
  providers: [AdminVendorsService],
})
export class AdminVendorsModule {}
