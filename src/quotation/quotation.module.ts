import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { NotificationModule } from '../notification/notification.module';
import { AdminQuotationController } from './controller/admin.quotation.controller';
import { VendorQuotationController } from './controller/vendor.quotation.controller';

@Module({
  imports: [NotificationModule],
  controllers: [AdminQuotationController, VendorQuotationController],
  providers: [QuotationService],
})
export class QuotationModule {}
