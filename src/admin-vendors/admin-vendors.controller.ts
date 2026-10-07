// admin-vendors/admin-vendors.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';

import { AdminVendorsService } from './admin-vendors.service';
import { VendorListQueryDto } from './dto/vendor-list-query.dto';
import { VendorListItemDto } from './dto/vendor-list-response.dto';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';

@ApiTags('Admin - Vendors')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/vendor')
export class AdminVendorsController {
  constructor(private readonly service: AdminVendorsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List vendors, filterable by status, searchable by ID or farm name',
  })
  @ApiOkResponse({ type: [VendorListItemDto] })
  list(@Query() query: VendorListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full detail for one vendor' })
  getDetail(@Param('id') id: string) {
    return this.service.getDetail(id);
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve a vendor (requires email already verified)',
  })
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Patch(':id/unapprove')
  @ApiOperation({ summary: "Revoke a vendor's approval" })
  unapprove(@Param('id') id: string) {
    return this.service.unapprove(id);
  }

  @Patch(':id/delete')
  @ApiOperation({ summary: 'Soft-delete a vendor' })
  softDelete(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
