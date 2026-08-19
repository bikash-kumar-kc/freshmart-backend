import { ApiProperty } from '@nestjs/swagger';

export class VendorApplyResponseDto {
  @ApiProperty({ example: 'randomId' })
  id!: string;

  @ApiProperty({ example: 'vendor@example.com' })
  email!: string;

  @ApiProperty({ example: 'I would like to apply as a vendor.' })
  message!: string;
}

export class VendorProfileResponseDto {
  @ApiProperty({ example: 'random vendor id' })
  id!: string;

  @ApiProperty({ example: 'Green Valley Farm' })
  farmName!: string;

  @ApiProperty({ example: 'Nepal' })
  farmOriginCountry!: string;

  @ApiProperty({ example: 'Organic farm producing fresh vegetables.' })
  farmDescription!: string | null;

  @ApiProperty({ example: 'Ram Bahadur' })
  farmOwner!: string;

  @ApiProperty({ example: '+9779812345678' })
  phoneNumber!: string;

  @ApiProperty({ example: 'Kathmandu, Nepal' })
  addressLocation!: string;

  @ApiProperty({ example: 'farmer@gmail.com' })
  email!: string;

  @ApiProperty({ example: '123456789' })
  vatNumber!: string | null;

  @ApiProperty({ example: 'https://example.com/pan-vat-certificate.pdf' })
  panVatCertificateUrl!: string;

  @ApiProperty({
    example: [
      'https://example.com/certificate-1.pdf',
      'https://example.com/certificate-2.pdf',
    ],
  })
  certificates!: string[] | null;

  @ApiProperty({ example: true })
  isVendorApproved!: boolean;

  @ApiProperty({ example: true })
  isEmailVerified!: boolean;

  @ApiProperty({ example: '2026-08-19T05:20:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-19T05:25:00.000Z' })
  updatedAt!: string;
}

export class ProductListingResponseDto {
  @ApiProperty({ example: 'random product listing id' })
  productListingId!: string;
}

class ProductListingImageDto {
  @ApiProperty({ example: 'https://example.com/product.jpg' })
  url!: string;

  @ApiProperty({ example: 'random-file-id' })
  fileId!: string;
}

class ProductListingVariantDto {
  @ApiProperty({ example: 10 })
  size!: number;

  @ApiProperty({ example: 1 })
  measurementId!: number;

  @ApiProperty({ example: 100 })
  quantity!: number;

  @ApiProperty({ example: 50 })
  pricePerUnit!: number;

  @ApiProperty({ example: 60, required: false })
  sellingPrice?: number;
}

export class ProductListingDetailsResponseDto {
  @ApiProperty({ example: 101 })
  productId!: number;

  @ApiProperty({ example: 'INVENTORY' })
  type!: 'inventory' | 'display';

  @ApiProperty({ example: 'गोलभेडा', required: false })
  localName?: string;

  @ApiProperty({ example: 5 })
  categoryId!: number;

  @ApiProperty({ example: 'organic, fresh, tomato', required: false })
  keywords?: string;

  @ApiProperty({
    example: 'Fresh organic tomatoes directly sourced from the farm.',
    required: false,
  })
  description?: string;

  @ApiProperty({ type: [ProductListingImageDto] })
  images!: ProductListingImageDto[];

  @ApiProperty({ example: 'Nepal' })
  originCountry!: string;

  @ApiProperty({ example: 'Green Valley Farm', required: false })
  farmName?: string;

  @ApiProperty({ example: 3 })
  packagingTypeId!: number;

  @ApiProperty({ example: true, required: false })
  isTaxable?: boolean;

  @ApiProperty({ type: [ProductListingVariantDto] })
  variants!: ProductListingVariantDto[];

  @ApiProperty({ example: 'random-product-listing-id' })
  id!: string;
}

class ProductListingItemDto {
  @ApiProperty({ example: 101 })
  id!: number;

  @ApiProperty({ example: 'Green Valley Farm', nullable: true })
  farmName!: string | null;

  @ApiProperty({ example: '2026-08-19T06:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-19T06:10:00.000Z', nullable: true })
  updatedAt!: string | null;

  @ApiProperty({ example: 'random-vendor-id' })
  vendorId!: string;

  @ApiProperty({ example: 10 })
  productId!: number;

  @ApiProperty({ example: 'inventory', enum: ['inventory', 'display'] })
  type!: 'inventory' | 'display';

  @ApiProperty({ example: 'गोलभेडा', nullable: true })
  localName!: string | null;

  @ApiProperty({ example: 5 })
  categoryId!: number;

  @ApiProperty({ example: 'organic, fresh', nullable: true })
  keywords!: string | null;

  @ApiProperty({ example: 'Fresh organic tomatoes.', nullable: true })
  description!: string | null;

  @ApiProperty({ type: [ProductListingImageDto], nullable: true })
  images!: ProductListingImageDto[] | null;

  @ApiProperty({ example: 'Nepal' })
  originCountry!: string;

  @ApiProperty({ example: 2 })
  packagingTypeId!: number;

  @ApiProperty({ example: true })
  isTaxable!: boolean;

  @ApiProperty({ example: true })
  isAcceptedByAdmin!: boolean;

  @ApiProperty({ example: false })
  isRejectedByAdmin!: boolean;

  @ApiProperty({ example: true, nullable: true })
  isLived!: boolean | null;

  @ApiProperty({ type: [ProductListingVariantDto] })
  variants!: ProductListingVariantDto[];
}

export class ProductListingListResponseDto {
  @ApiProperty({ type: [ProductListingItemDto] })
  data!: ProductListingItemDto[];

  @ApiProperty({ example: 1 })
  currentPage!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 100 })
  totalProducts!: number;
}

class ProductListingDataDto {
  @ApiProperty({ example: 101 })
  id!: number;

  @ApiProperty({ example: 'गोलभेडा', nullable: true })
  localName!: string | null;

  @ApiProperty({
    example: 'inventory',
    enum: ['inventory', 'display'],
  })
  type!: 'inventory' | 'display';

  @ApiProperty({ type: [ProductListingVariantDto] })
  variants!: ProductListingVariantDto[];

  @ApiProperty({ example: true })
  isAcceptedByAdmin!: boolean;

  @ApiProperty({ example: false })
  isRejectedByAdmin!: boolean;

  @ApiProperty({ example: '2026-08-19T06:00:00.000Z' })
  createdAt!: string;
}

export class ProductListingSummaryResponseDto {
  @ApiProperty({ example: 1 })
  currentPage!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 100 })
  totalProducts!: number;

  @ApiProperty({ type: [ProductListingDataDto] })
  data!: ProductListingDataDto[];
}

export class VendorStatsResponseDto {
  @ApiProperty({ example: 100 }) totalProducts!: number;
  @ApiProperty({ example: 10 }) totalRejectedProducts!: number;
  @ApiProperty({ example: 80 }) totalLiveProducts!: number;
  @ApiProperty({ example: 250 }) totalProductOrders!: number;
  @ApiProperty({ example: 15 }) totalQuotationFromAdmin!: number;
  @ApiProperty({ example: 8 }) totalQuotationToReviewByVendor!: number;
  @ApiProperty({ example: 5 }) totalQuotationCounterByVendor!: number;
  @ApiProperty({ example: 180 }) totalCompletedOrders!: number;
  @ApiProperty({ example: 12 }) totalCancelledOrders!: number;
  @ApiProperty({ example: 75 }) totalApprovedProducts!: number;
  @ApiProperty({ example: 25 }) totalUnapprovedProducts!: number;
}
