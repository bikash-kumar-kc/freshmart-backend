// quotation/admin-quotation.controller.ts
import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { QuotationService } from './quotation.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { IPayloadType } from '../auth/types/token.type';

@ApiTags('Admin - Quotation')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/quotation')
export class AdminQuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateQuotationDto) {
    const { adminId } = req['user'] as IPayloadType;
    return this.quotationService.create(adminId as string, dto);
  }

  @Patch(':id/send')
  send(@Param('id') id: string) {
    return this.quotationService.send(Number(id));
  }

  @Patch(':id/reapprove')
  reapprove(@Param('id') id: string) {
    return this.quotationService.reapprove(Number(id));
  }

  @Patch(':id/delivered')
  markDelivered(@Param('id') id: string) {
    return this.quotationService.markDelivered(Number(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotationService.remove(Number(id));
  }

  @Get()
  findAll(@Query('status') status?: 'draft' | 'sent') {
    return this.quotationService.findAllForAdmin(status);
  }

  @Get('pending')
  findPending(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.quotationService.findPendingForVendor(vendorId as string);
  }

  @Get('responded')
  findResponded(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.quotationService.findRespondedForVendor(vendorId as string);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    if (isNaN(Number(id)))
      throw new BadRequestException('Quotation id must Number');
    return this.quotationService.findOneForAdmin(id);
  }
}
