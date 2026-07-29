import { Controller, Post, Param, Get, Body, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IGoLiveInventoryDto } from './dto/go-live-inventory.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';

@ApiTags('Admin - Products')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('from-quotation-live/:quotationId')
  @ApiOperation({
    summary:
      'Admin promotes a delivered quotation into a live Inventory product',
  })
  goLiveFromQuotation(
    @Param('quotationId') quotationId: string,
    @Body() dto: IGoLiveInventoryDto,
  ) {
    return this.productsService.goLiveFromQuotation(Number(quotationId), dto);
  }

  @Get('ready-to-live')
  findReadyToGoLive() {
    return this.productsService.findReadyToGoLive();
  }

  @Post('from-listing-live/:productListingId')
  @ApiOperation({
    summary:
      'Admin promotes an approved Display listing directly into a live product',
  })
  goLiveFromDisplayListing(
    @Param('productListingId') productListingId: string,
  ) {
    return this.productsService.goLiveFromDisplayListing(
      Number(productListingId),
    );
  }
}
