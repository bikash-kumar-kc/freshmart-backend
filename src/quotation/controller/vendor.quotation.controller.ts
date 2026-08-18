import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../../auth/role.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { Roles } from '../../auth/role.decorator';
import { QuotationService } from '../quotation.service';
import { IPayloadType } from '../../auth/types/token.type';
import { IVendorCounterQuotationDto } from '../dto/vendor-counter-quotation.dto';
import type { Request } from 'express';
import { VendorQuotationDto } from '../dto/findVendorQuotation.dto';

@ApiTags('Vendor - Quotation')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('vendor')
@Controller('vendor/quotation')
export class VendorQuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Get()
  async findMine(@Req() req: Request, @Query() query: VendorQuotationDto) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.quotationService.findAllForVendor(
      vendorId as string,
      query.page,
      query.limit,
    );
  }

  @Get('/delivered')
  @ApiOperation({ summary: 'get vendor delivered quotation' })
  findDeliveredQuotation(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.quotationService.findQuotationDelivered(vendorId as string);
  }

  @Get(':id')
  @ApiOperation({ summary: 'get vendor delivered quotation by quotation id' })
  findOne(@Req() req: Request, @Param() param: { id: string }) {
    if (isNaN(Number(param.id)))
      throw new BadRequestException('Quotation id must be number');
    const { vendorId } = req['user'] as IPayloadType;
    return this.quotationService.findOneForVendor(param.id, vendorId as string);
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
