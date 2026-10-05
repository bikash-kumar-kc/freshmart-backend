// admin-orders/admin-inventory-orders.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';

import { AdminInventoryOrdersService } from './admin-inventory-orders.service';
import { InventoryOrderQueryDto } from '../dto/inventory-order-query.dto';
import { UpdateInventoryOrderStatusDto } from '../dto/update-inventory-order-status.dto';
import { Roles } from '../../auth/role.decorator';
import { RolesGuard } from '../../auth/role.guard';

@ApiTags('Admin - Inventory Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/orders/inventory')
export class AdminInventoryOrdersController {
  constructor(private readonly service: AdminInventoryOrdersService) {}

  @Get()
  @ApiOperation({
    summary:
      'List inventory orders, filterable by status, searchable by order ID',
  })
  list(@Query() query: InventoryOrderQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full detail for one inventory order' })
  getDetail(@Param('id') id: string) {
    return this.service.getDetail(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: "Transition an inventory order's status (state-machine enforced)",
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryOrderStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
