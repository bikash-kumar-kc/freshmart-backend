import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DisplayOrderService } from './display-order.service';
import { Roles } from '../auth/role.decorator';
import { IPayloadType } from '../auth/types/token.type';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { VendorDisplayOrderPaginationDto } from './dto/vendor-display-order-pagination.dto';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import {
  DisplayOrderDetailsResponseDto,
  DisplayOrderResponseDto,
} from './dto/response.dto';

@UseGuards(AuthGuard, RolesGuard)
@Roles('vendor')
@Controller('display-order/vendor')
export class VendorDisplayOrderController {
  constructor(private readonly displayOrderService: DisplayOrderService) {}

  @Get()
  @ApiOperation({ summary: 'Vendor get list of display orders' })
  @ApiOkResponse({
    type: DisplayOrderResponseDto,
    example: {
      currentPage: 1,
      totalPages: 5,
      hasNextPage: true,
      limit: 20,
      totalOrders: 100,
      orders: [
        {
          orderId: 'ORD-123456',
          userId: 'user-id-123',
          email: 'customer@gmail.com',
          vendorId: 'vendor-id-123',
          displayOrderStatus: 'PENDING',
          type: 'display',
          isPayment: true,
          createdAt: '2026-08-19T07:30:00.000Z',
        },
      ],
    },
  })
  findAll(
    @Req() req: Request,
    @Query() query: VendorDisplayOrderPaginationDto,
  ) {
    const user = req['user'] as IPayloadType;
    return this.displayOrderService.findAllForVendor(
      user.vendorId as string,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  @Roles('vendor')
  @ApiOperation({ summary: 'Vendor get details of display order' })
  @ApiOkResponse({
    type: DisplayOrderDetailsResponseDto,
    example: {
      id: 'ORD-123456',
      createdAt: '2026-08-19T07:30:00.000Z',
      isPayment: true,
      type: 'display',
      userId: 'user-id-123',
      displayOrderStatus: 'pending',
      items: [
        {
          price: 100,
          productName: 'Organic Tomato',
          localName: 'गोलभेडा',
          orderId: 'ORD-123456',
          vendorId: 'vendor-id-123',
          id: 1,
          productId: 'product-id-123',
          productListingId: 'listing-id-123',
          quantity: 5,
          slug: 'organic-tomato',
          weightValue: 1,
          weightUnit: 'kg',
          productVariantId: 'variant-id-123',
        },
      ],
    },
  })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.displayOrderService.findOneForVendor(
      id,
      (req['user'] as IPayloadType).vendorId as string,
    );
  }

  @Patch(':id/status')
  @Roles('vendor')
  updateStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Body('status') status: 'processing' | 'delivered',
  ) {
    return this.displayOrderService.updateStatus(
      id,
      (req['user'] as IPayloadType).vendorId as string,
      status,
    );
  }

  @Patch(':id/cancel')
  @Roles('vendor')
  cancel(@Param('id') id: string, @Req() req: Request) {
    return this.displayOrderService.cancel(
      id,
      (req['user'] as IPayloadType).vendorId as string,
    );
  }
}
