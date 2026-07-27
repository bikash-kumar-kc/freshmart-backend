import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { IListVendorsQueryDto } from './dto/list-vendors-query..dto';
import { IAdminUpdateVendorDto } from './dto/admin-update-vendor.dto';
import { IAdminListProductListingQueryDto } from './dto/admin-product-list-query.dto';

@ApiTags('Admin - Vendors')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary:
      'List vendors, optionally filtered by email-verified / approved status',
  })
  list(@Query() query: IListVendorsQueryDto) {
    return this.adminService.listVendors(query);
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve a vendor application (requires email already verified)',
  })
  approve(@Param('id') id: string) {
    return this.adminService.approveVendor(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Admin updates a vendor's registration info" })
  update(@Param('id') id: string, @Body() dto: IAdminUpdateVendorDto) {
    return this.adminService.adminUpdateVendor(id, dto);
  }

  @Get('product-listing')
  @ApiOperation({
    summary:
      'Admin views all product listings, optionally filtered by approval status',
  })
  findAll(@Query() query: IAdminListProductListingQueryDto) {
    const isVerified =
      query.verified !== undefined ? query.verified === 'true' : undefined;
    return this.adminService.findAllForAdmin(isVerified);
  }

  @Patch('product-listing/:id/approve')
  @ApiOperation({ summary: 'Admin approves a pending product listing' })
  approveProduct(@Param('id') id: string) {
    return this.adminService.approveListing(Number(id));
  }

  @Patch('product-listing/:id/reject')
  @ApiOperation({ summary: 'Admin rejects a pending product listing' })
  reject(@Param('id') id: string) {
    return this.adminService.rejectListing(Number(id));
  }

  // @Post()
  // create(@Body() createAdminDto: CreateAdminDto) {
  //   return this.adminService.create(createAdminDto);
  // }

  // @Get()
  // findAll() {
  //   return this.adminService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.adminService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
  //   return this.adminService.update(+id, updateAdminDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.adminService.remove(+id);
  // }
}
