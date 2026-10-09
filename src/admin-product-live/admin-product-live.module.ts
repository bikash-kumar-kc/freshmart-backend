// admin-product-live/admin-product-live.module.ts
import { Module } from '@nestjs/common';
import { AdminProductLiveController } from './admin-product-live.controller';
import { AdminProductLiveService } from './admin-product-live.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [AdminProductLiveController],
  providers: [AdminProductLiveService],
})
export class AdminProductLiveModule {}
