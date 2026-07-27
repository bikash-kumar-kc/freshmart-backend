import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { ApplyVendorDto } from './dto/apply-vendor.dto';
import { VendorService } from './vendor.service';
import { IVerifyOtpDto } from './dto/verify-otp.dto';
import { IResendOtpDto } from './dto/resend-otp.dto';
import { Roles } from '../auth/role.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { IPayloadType } from '../auth/types/token.type';
import { ICreateProductListingDto } from './dto/create-product-listing.dto';
import { ProductListingCacheInterceptor } from './product-listing-cache/product-listing-cache.interceptor';
import { VendorOwnershipGuard } from '../auth/vendor-ownership.guard';
import { IProductListingType } from './types/product-listing.type';
import { IListProductListingQueryDto } from './dto/list-product-listing-query.dto';
import { ProductListingListCacheInterceptor } from './product-listing-list-cache/product-listing-list-cache.interceptor';

@ApiTags('Vendors')
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorsService: VendorService) {}

  @Post('apply')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a new vendor application' })
  apply(@Body() dto: ApplyVendorDto) {
    return this.vendorsService.apply(dto);
  }

  @Post('otp/verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // generous — real limiting is the 5-attempt cap inside the OTP record itself
  @ApiOperation({ summary: 'Verify vendor application email with OTP' })
  verifyOtp(@Body() dto: IVerifyOtpDto) {
    return this.vendorsService.verifyOtp(dto);
  }

  @Post('otp/resend')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({ summary: 'Resend OTP for vendor email verification' })
  resendOtp(@Body() dto: IResendOtpDto) {
    return this.vendorsService.resendOtp(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('vendor')
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get the logged-in vendor's own profile/application info",
  })
  getMyProfile(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.vendorsService.getVendorById(vendorId as string);
  }

  @Post()
  @ApiBearerAuth()
  @ApiHeader({
    name: 'Idempotency key',
    description: 'Idempotency key is required',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('vendor')
  @UseInterceptors(ProductListingCacheInterceptor)
  @ApiOperation({
    summary: 'Vendor creates a new product listing with one or more variants',
  })
  create(@Req() req: Request, @Body() dto: ICreateProductListingDto) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.vendorsService.create(vendorId as string, dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard, VendorOwnershipGuard)
  @Roles('vendor')
  @UseInterceptors(ProductListingCacheInterceptor)
  findOne(@Req() req: Request) {
    return req['resource'] as IProductListingType;
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('vendor')
  @UseInterceptors(ProductListingListCacheInterceptor)
  @ApiOperation({
    summary:
      "List the vendor's own product listings, filtered by admin-approval status",
  })
  findAllMine(
    @Req() req: Request,
    @Query() query: IListProductListingQueryDto,
  ) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.vendorsService.findAllByVendor(
      vendorId as string,
      query.verified === 'true',
    );
  }
}
