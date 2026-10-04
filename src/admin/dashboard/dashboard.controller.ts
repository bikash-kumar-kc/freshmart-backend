// admin-dashboard/admin-dashboard.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';

import { TopProductResponseDto } from './dto/top-product-response.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/role.guard';
import { Roles } from '../../auth/role.decorator';
import { AdminService } from '../admin.service';
import { TopProductsQueryDto } from './dto/top-product-query.dto';

@ApiTags('Admin - Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminService) {}

  @Get('top-products')
  @ApiOperation({
    summary:
      'Top 5 most popular products (precomputed by Insight Sync), filterable by period and stock status',
  })
  @ApiOkResponse({ type: [TopProductResponseDto] })
  getTopProducts(@Query() query: TopProductsQueryDto) {
    return this.dashboardService.getTopProducts(query);
  }
}
