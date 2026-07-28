import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { AdminQuotationController } from './admin.quotation.controller';
import { NotificationModule } from '../notification/notification.module';
import { VendorQuotationController } from './vendor.quotation.controller';

@Module({
  imports: [NotificationModule],
  controllers: [AdminQuotationController, VendorQuotationController],
  providers: [QuotationService],
})
export class QuotationModule {}
