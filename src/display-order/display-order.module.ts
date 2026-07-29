import { Module } from '@nestjs/common';
import { DisplayOrderService } from './display-order.service';
import { DisplayOrderController } from './display-order.controller';

@Module({
  controllers: [DisplayOrderController],
  providers: [DisplayOrderService],
})
export class DisplayOrderModule {}
