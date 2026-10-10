import { Module } from '@nestjs/common';
import { AdminQuotationsService } from './admin-quotations.service';
import { AdminQuotationsController } from './admin-quotations.controller';

@Module({
  controllers: [AdminQuotationsController],
  providers: [AdminQuotationsService],
})
export class AdminQuotationsModule {}
