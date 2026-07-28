// quotation/vendor-quotation.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';

import { QuotationService } from './quotation.service';
import { IVendorCounterQuotationDto } from './dto/vendor-counter-quotation.dto';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { IPayloadType } from '../auth/types/token.type';

@ApiTags('Vendor - Quotation')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('vendor')
@Controller('vendor/quotation')
export class VendorQuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Get()
  findMine(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.quotationService.findAllForVendor(vendorId as string);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.quotationService.vendorAccept(Number(id), vendorId as string);
  }

  @Patch(':id/counter')
  counter(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: IVendorCounterQuotationDto,
  ) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.quotationService.vendorCounter(
      Number(id),
      vendorId as string,
      dto,
    );
  }
}
