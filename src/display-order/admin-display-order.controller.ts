import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { DisplayOrderService } from './display-order.service';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';

@ApiTags('Admin - Display Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/display-order')
export class AdminDisplayOrderController {
  constructor(private readonly displayOrderService: DisplayOrderService) {}

  @Get()
  @ApiOperation({ summary: 'Admin views all Display orders, read-only' })
  findAll() {
    return this.displayOrderService.findAllForAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin views a single Display order, read-only' })
  findOne(@Param('id') id: string) {
    return this.displayOrderService.findOneForAdmin(id);
  }
}
