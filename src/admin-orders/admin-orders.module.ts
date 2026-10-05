import { Module } from '@nestjs/common';
import { AdminInventoryOrdersController } from './inventory/admin-inventory-orders.controller';
import { AdminDisplayOrdersController } from './display/admin-display-orders.controller';
import { AdminInventoryOrdersService } from './inventory/admin-inventory-orders.service';
import { AdminDisplayOrdersService } from './display/admin-display-orders.service';

@Module({
  controllers: [AdminInventoryOrdersController, AdminDisplayOrdersController],
  providers: [AdminInventoryOrdersService, AdminDisplayOrdersService],
})
export class AdminOrdersModule {}
