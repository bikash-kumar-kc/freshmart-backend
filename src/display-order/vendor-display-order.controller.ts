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

@UseGuards(AuthGuard, RolesGuard)
@Roles('vendor')
@Controller('display-order/vendor')
export class VendorDisplayOrderController {
  constructor(private readonly displayOrderService: DisplayOrderService) {}

  @Get()
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
