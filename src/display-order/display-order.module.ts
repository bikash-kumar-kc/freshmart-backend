import { Module } from '@nestjs/common';
import { DisplayOrderService } from './display-order.service';
import { DisplayOrderController } from './display-order.controller';
import { NotificationModule } from '../notification/notification.module';
import { BullModule } from '@nestjs/bullmq';
import { AdminDisplayOrderController } from './admin-display-order.controller';
import { VendorDisplayOrderController } from './vendor-display-order.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'display-order-timeout' }),
    NotificationModule,
  ],
  controllers: [
    DisplayOrderController,
    AdminDisplayOrderController,
    VendorDisplayOrderController,
  ],
  providers: [DisplayOrderService],
})
export class DisplayOrderModule {}
