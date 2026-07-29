import { Module } from '@nestjs/common';
import { DisplayOrderService } from './display-order.service';
import { DisplayOrderController } from './display-order.controller';
import { NotificationModule } from '../notification/notification.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'display-order-timeout' }),
    NotificationModule,
  ],
  controllers: [DisplayOrderController],
  providers: [DisplayOrderService],
})
export class DisplayOrderModule {}
