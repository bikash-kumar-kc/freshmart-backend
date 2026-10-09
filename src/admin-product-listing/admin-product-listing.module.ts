import { Module } from '@nestjs/common';
import { AdminProductListingController } from './admin-product-listing.controller';
import { AdminProductListingsService } from './admin-product-listing.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [AdminProductListingController],
  providers: [AdminProductListingsService],
})
export class AdminProductListingModule {}
