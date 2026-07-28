// quotation/vendor-quotation.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../../auth/role.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { Roles } from '../../auth/role.decorator';
import { QuotationService } from '../quotation.service';
import { IPayloadType } from '../../auth/types/token.type';
import { IVendorCounterQuotationDto } from '../dto/vendor-counter-quotation.dto';

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

  @Get('/delivered')
  findDeliveredQuotation(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.quotationService.findQuotationDelivered(vendorId as string);
  }

  @Get(':id')
  findOne(@Param() id: string, @Res() req: Request) {
    if (isNaN(Number(id)))
      throw new BadRequestException('Quotation id must be number');

    const { vendorId } = req['user'] as IPayloadType;

    return this.quotationService.findOneForVendor(id, vendorId as string);
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
