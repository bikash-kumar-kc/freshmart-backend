import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  UseInterceptors,
  Query,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
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
import { IUpdateProductListingDto } from './dto/update-product-listing.dto';
import { ProductListingUpdateCacheInterceptor } from './product-listing-update-cache/product-listing-update-cache.interceptor';
import { ISearchProductListingQueryDto } from './dto/search-product-listing-query.dto';
import {
  ProductListingDetailsResponseDto,
  ProductListingResponseDto,
  ProductListingSummaryResponseDto,
  VendorApplyResponseDto,
  VendorProfileResponseDto,
  VendorStatsResponseDto,
} from './dto/response.dto';

@ApiTags('Vendors')
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorsService: VendorService) {}

  @Post('apply')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a new vendor application' })
  @ApiOkResponse({
    type: VendorApplyResponseDto,
    example: {
      id: 'random vendor id',
      email: 'name@gmail.com',
      message: 'vendor apply successfull message',
    },
  })
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

  @Get('profile')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('vendor')
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get the logged-in vendor's own profile/application info",
  })
  @ApiOkResponse({
    type: VendorProfileResponseDto,
    example: {
      id: 'random vendor id',
      farmName: 'Green Valley Farm',
      farmOriginCountry: 'Nepal',
      farmDescription: 'Organic farm producing fresh vegetables.',
      farmOwner: 'Ram Bahadur',
      phoneNumber: '+9779812345678',
      addressLocation: 'Kathmandu, Nepal',
      email: 'farmer@gmail.com',
      vatNumber: '123456789',
      panVatCertificateUrl: 'https://example.com/pan-vat-certificate.pdf',
      certificates: [
        'https://example.com/certificate-1.pdf',
        'https://example.com/certificate-2.pdf',
      ],
      isVendorApproved: true,
      isEmailVerified: true,
      createdAt: '2026-08-19T05:20:00.000Z',
      updatedAt: '2026-08-19T05:25:00.000Z',
    },
  })
  getMyProfile(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.vendorsService.getVendorById(vendorId as string);
  }

  @Post('product-listing')
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
  @ApiOkResponse({
    type: ProductListingResponseDto,
    example: { productListingId: 'random product listing id' },
  })
  create(@Req() req: Request, @Body() dto: ICreateProductListingDto) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.vendorsService.create(vendorId as string, dto);
  }

  @Get('stats/dashboard')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('vendor')
  @ApiOperation({
    summary:
      "Vendor's dashboard stats: product counts by approval status, and total orders",
  })
  @ApiOkResponse({
    type: VendorStatsResponseDto,
    example: {
      totalProducts: 100,
      totalRejectedProducts: 10,
      totalLiveProducts: 80,
      totalProductOrders: 250,
      totalQuotationFromAdmin: 15,
      totalQuotationToReviewByVendor: 8,
      totalQuotationCounterByVendor: 5,
      totalCompletedOrders: 180,
      totalCancelledOrders: 12,
      totalApprovedProducts: 75,
      totalUnapprovedProducts: 25,
    },
  })
  getStats(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.vendorsService.getVendorStats(vendorId as string);
  }

  @Get('rejected')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('vendor')
  @ApiOperation({ summary: 'Vendor views their own rejected product listings' })
  findRejected(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.vendorsService.findRejectedByAdmin(vendorId as string);
  }

  @Get('search')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('vendor')
  @ApiOperation({
    summary:
      'Vendor searches their own product listings by free text — matches listing ID or product name',
  })
  search(@Req() req: Request, @Query() query: ISearchProductListingQueryDto) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.vendorsService.searchByVendor(vendorId as string, query.q);
  }

  @Get('product-listing/:id')
  @UseGuards(AuthGuard, RolesGuard, VendorOwnershipGuard)
  @Roles('vendor')
  @UseInterceptors(ProductListingCacheInterceptor)
  @ApiOperation({
    summary: 'vendor gets  product-lisitng product by id ',
  })
  @ApiOkResponse({
    type: ProductListingDetailsResponseDto,
    example: {
      productId: 101,
      type: 'INVENTORY',
      localName: 'गोलभेडा',
      categoryId: 5,
      keywords: 'organic, fresh, tomato',
      description: 'Fresh organic tomatoes directly sourced from the farm.',
      images: [
        {
          url: 'https://example.com/product.jpg',
          fileId: 'random-file-id',
        },
      ],
      originCountry: 'Nepal',
      farmName: 'Green Valley Farm',
      packagingTypeId: 3,
      isTaxable: true,
      variants: [
        {
          size: 10,
          measurementId: 1,
          quantity: 100,
          pricePerUnit: 50,
          sellingPrice: 60,
        },
      ],
      id: 'random-product-listing-id',
    },
  })
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
  @ApiOkResponse({
    type: ProductListingSummaryResponseDto,
    example: {
      currentPage: 1,
      totalPages: 5,
      hasNextPage: true,
      limit: 20,
      totalProducts: 100,
      data: [
        {
          id: 101,
          localName: 'गोलभेडा',
          type: 'inventory',
          variants: [
            {
              id: 1,
              size: 10,
              measurementId: 1,
              quantity: 100,
              pricePerUnit: 50,
              sellingPrice: 60,
            },
          ],
          isAcceptedByAdmin: true,
          isRejectedByAdmin: false,
          createdAt: '2026-08-19T06:00:00.000Z',
        },
      ],
    },
  })
  async findAllMine(
    @Req() req: Request,
    @Query() query: IListProductListingQueryDto,
  ) {
    const { vendorId } = req['user'] as IPayloadType;
    const response = await this.vendorsService.findAllByVendor(
      vendorId as string,
      query.verified === 'true',
      query.page,
      query.limit,
    );

    return response;
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard, VendorOwnershipGuard)
  @Roles('vendor')
  @UseInterceptors(ProductListingUpdateCacheInterceptor)
  @ApiOperation({
    summary:
      'Vendor edits their own pending (not-yet-approved) product listing',
  })
  update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: IUpdateProductListingDto,
  ) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.vendorsService.update(Number(id), vendorId as string, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard, VendorOwnershipGuard)
  @Roles('vendor')
  @ApiOperation({
    summary: 'Vendor deletes their own product listing, approved or not',
  })
  remove(@Param('id') id: string, @Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.vendorsService.remove(Number(id), vendorId as string);
  }
}
