import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { DisplayOrderService } from './display-order.service';
import { Roles } from '../auth/role.decorator';
import { IPayloadType } from '../auth/types/token.type';

@Controller('display-order')
export class DisplayOrderController {
  constructor(private readonly displayOrderService: DisplayOrderService) {}

  // display-order/vendor-display-order.controller.ts
  @Get()
  @Roles('vendor')
  findAll(@Req() req: Request) {
    return this.displayOrderService.findAllForVendor(
      (req['user'] as IPayloadType).sub,
    );
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
