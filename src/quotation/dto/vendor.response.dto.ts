import { ApiProperty } from '@nestjs/swagger';

class VendorQuotationDto {
  @ApiProperty({ example: 1 })
  quotationId!: number;

  @ApiProperty({ example: 'vendor-id-123' })
  vendorId!: string;

  @ApiProperty({ example: 101 })
  productListingId!: number;

  @ApiProperty({
    example: 'Organic Tomato',
    nullable: true,
  })
  productLocalName!: string | null;

  @ApiProperty({
    example: '2026-08-19T08:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    example: 'request',
    enum: ['delivered', 'approved', 'request', 'rejected', 'rechecking'],
  })
  status!: 'delivered' | 'approved' | 'request' | 'rejected' | 'rechecking';

  @ApiProperty({ example: 25 })
  totalRequestedProducts!: number;
}

export class VendorQuotationListResponseDto {
  @ApiProperty({ type: [VendorQuotationDto] })
  data!: VendorQuotationDto[];

  @ApiProperty({ example: 1 })
  currentPage!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 100 })
  totalQuotation!: number;
}

class VendorQuotationVariantDto {
  @ApiProperty({ example: 1 })
  productListingVarientsId!: number;

  @ApiProperty({ example: 10 })
  size!: number;

  @ApiProperty({ example: 1 })
  measurementId!: number;

  @ApiProperty({ example: 100 })
  originalPricePerUnit!: number;

  @ApiProperty({ example: 120 })
  adminSuggestedPricePerUnit!: number;

  @ApiProperty({ example: 500 })
  totalQuantity!: number;

  @ApiProperty({ example: 101 })
  quotationVariantId!: number;
}

export class VendorQuotationDetailsResponseDto {
  @ApiProperty({ example: 1 })
  quotationId!: number;

  @ApiProperty({ example: 'vendor-id-123' })
  vendorId!: string;

  @ApiProperty({ example: 101 })
  productListingId!: number;

  @ApiProperty({
    example: 'Organic Tomato',
    nullable: true,
  })
  productLocalName!: string | null;

  @ApiProperty({ type: [VendorQuotationVariantDto] })
  variants!: VendorQuotationVariantDto[];

  @ApiProperty({
    example: '2026-08-19T08:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    example: 'request',
    enum: ['delivered', 'approved', 'request', 'rejected', 'rechecking'],
  })
  status!: 'delivered' | 'approved' | 'request' | 'rejected' | 'rechecking';
}
