import { AdminQuotationsService } from './admin-quotations.service';
import {
  Get,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  Body,
  Req,
  Controller,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuotationListQueryDto } from './dto/quotation-list-query.dto';
import { CreateQuotationsDto } from './dto/create-quotations.dto';
import { IPayloadType } from '../auth/types/token.type';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';

@ApiTags('Admin - quotation')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin-quotations')
export class AdminQuotationsController {
  constructor(
    private readonly adminQuotationsService: AdminQuotationsService,
  ) {}

  @Get('options/vendors')
  @ApiOperation({ summary: 'Approved vendors for the create-quotation page' })
  getVendorOptions() {
    return this.adminQuotationsService.getApprovedVendors();
  }

  @Get('options/vendors/:vendorId/products')
  @ApiOperation({
    summary: 'Approved, inventory-type products for one vendor, with variants',
  })
  getProductOptions(@Param('vendorId') vendorId: string) {
    return this.adminQuotationsService.getEligibleProducts(vendorId);
  }

  // existing @Get('ready-to-live') stays here

  @Get()
  @ApiOperation({
    summary: 'List quotations by bucket and status, searchable by quotation ID',
  })
  list(@Query() query: QuotationListQueryDto) {
    return this.adminQuotationsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Full detail for one quotation' })
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminQuotationsService.getDetail(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create and send one quotation per product, atomically',
  })
  create(@Req() req: Request, @Body() dto: CreateQuotationsDto) {
    console.log(req['user']);
    return this.adminQuotationsService.create(
      (req['user'] as IPayloadType).sub,
      dto,
    ); // use .sub if that's your token's field
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a rechecking or countered quotation' })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.adminQuotationsService.approve(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a pending, rechecking or countered quotation',
  })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.adminQuotationsService.cancel(id);
  }
}
