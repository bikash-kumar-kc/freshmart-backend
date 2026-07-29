import { Module } from '@nestjs/common';
import { DisplayOrderService } from './display-order.service';
import { DisplayOrderController } from './display-order.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [DisplayOrderController],
  providers: [DisplayOrderService],
})
export class DisplayOrderModule {}
