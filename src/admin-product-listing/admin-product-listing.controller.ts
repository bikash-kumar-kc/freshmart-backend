import { Controller } from '@nestjs/common';
import { Get, Post, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ProductListingListQueryDto } from './dto/product-listing-list-query.dto';
import { AdminProductListingsService } from './admin-product-listing.service';

@Controller('admin-product-listing')
export class AdminProductListingController {
  constructor(
    private readonly adminProductListingService: AdminProductListingsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List vendor product listings (rejected excluded)' })
  list(@Query() query: ProductListingListQueryDto) {
    return this.adminProductListingService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Full detail for one product listing' })
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductListingService.getDetail(id);
  }

  @Post(':id/notify-vendor')
  @ApiOperation({
    summary: 'Ask the vendor to update stock (approved display listings only)',
  })
  notifyVendor(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductListingService.notifyVendorToUpdateStock(id);
  }
}
