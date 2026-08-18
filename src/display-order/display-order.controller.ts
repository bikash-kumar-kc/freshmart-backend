import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { DisplayOrderService } from './display-order.service';
import { CreateDisplayOrderDto } from './dto/create-display-order.dto';
import { Roles } from '../auth/role.decorator';
import { IPayloadType } from '../auth/types/token.type';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role.guard';

@Controller('display-order')
export class DisplayOrderController {
  constructor(private readonly displayOrderService: DisplayOrderService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('user')
  create(@Req() req: Request, @Body() dto: CreateDisplayOrderDto) {
    const user = req['user'] as IPayloadType;

    return this.displayOrderService.create(user.sub, dto);
  }

}
