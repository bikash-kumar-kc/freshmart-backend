// admin-product-live/admin-product-live.controller.ts
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
import { AuthGuard } from '../auth/auth.guard';
import { AdminProductLiveService } from './admin-product-live.service';
import { ProductLiveListQueryDto } from './dto/product-live-list-query.dto';
import { UpdateProductLiveStatusDto } from './dto/update-product-live-status.dto';
import { Roles } from '../auth/role.decorator';
import { RolesGuard } from '../auth/role.guard';

@ApiTags('Admin - Product Live')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/products/live')
export class AdminProductLiveController {
  constructor(private readonly service: AdminProductLiveService) {}

  @Get()
  @ApiOperation({
    summary: 'List vendor products filterable by stock, live status and type',
  })
  list(@Query() query: ProductLiveListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Performance detail for one product' })
  getDetail(@Param('id') id: string) {
    return this.service.getDetail(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Publish a draft product or move a live product back to draft',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductLiveStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
