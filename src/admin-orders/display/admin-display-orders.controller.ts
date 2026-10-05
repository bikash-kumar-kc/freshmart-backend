// admin-orders/admin-display-orders.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';

import { AdminDisplayOrdersService } from './admin-display-orders.service';
import { DisplayOrderQueryDto } from '../dto/display-order-query.dto';
import { Roles } from '../../auth/role.decorator';
import { RolesGuard } from '../../auth/role.guard';

@ApiTags('Admin - Display Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/orders/display')
export class AdminDisplayOrdersController {
  constructor(private readonly service: AdminDisplayOrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'List display orders (read-only — vendor controls status)',
  })
  list(@Query() query: DisplayOrderQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get full detail for one display order (read-only)',
  })
  getDetail(@Param('id') id: string) {
    return this.service.getDetail(id);
  }
}
