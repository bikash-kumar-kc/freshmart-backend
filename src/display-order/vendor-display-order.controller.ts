import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DisplayOrderService } from './display-order.service';
import { Roles } from '../auth/role.decorator';
import { IPayloadType } from '../auth/types/token.type';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role.guard';

@UseGuards(AuthGuard, RolesGuard)
@Roles('vendor')
@Controller('display-order/vendor')
export class VendorDisplayOrderController {
  constructor(private readonly displayOrderService: DisplayOrderService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = req['user'] as IPayloadType;
    return this.displayOrderService.findAllForVendor(user.vendorId as string);
  }

  @Get(':id')
  @Roles('vendor')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.displayOrderService.findOneForVendor(
      id,
      (req['user'] as IPayloadType).sub,
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
      (req['user'] as IPayloadType).sub,
      status,
    );
  }

  @Patch(':id/cancel')
  @Roles('vendor')
  cancel(@Param('id') id: string, @Req() req: Request) {
    return this.displayOrderService.cancel(
      id,
      (req['user'] as IPayloadType).sub,
    );
  }
}
