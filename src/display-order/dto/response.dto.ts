import { ApiProperty } from '@nestjs/swagger';

class DisplayOrderDto {
  @ApiProperty({ example: 'ORD-123456' })
  orderId!: string;

  @ApiProperty({ example: 'user-id-123' })
  userId!: string;

  @ApiProperty({ example: 'customer@gmail.com' })
  email!: string;

  @ApiProperty({ example: 'vendor-id-123' })
  vendorId!: string;

  @ApiProperty({ example: 'PENDING' })
  displayOrderStatus!: string;

  @ApiProperty({ example: 'display', enum: ['display'] })
  type!: 'display';

  @ApiProperty({ example: true })
  isPayment!: boolean;

  @ApiProperty({ example: '2026-08-19T07:30:00.000Z' })
  createdAt!: string;
}

export class DisplayOrderResponseDto {
  @ApiProperty({ example: 1 })
  currentPage!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 100 })
  totalOrders!: number;

  @ApiProperty({ type: [DisplayOrderDto] })
  orders!: DisplayOrderDto[];
}

class DisplayOrderItemDto {
  @ApiProperty({ example: 100 })
  price!: number;

  @ApiProperty({ example: 'Organic Tomato' })
  productName!: string;

  @ApiProperty({ example: 'गोलभेडा' })
  localName!: string;

  @ApiProperty({ example: 'ORD-123456' })
  orderId!: string;

  @ApiProperty({
    example: 'vendor-id-123',
    nullable: true,
  })
  vendorId!: string | null;

  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'product-id-123' })
  productId!: string;

  @ApiProperty({
    example: 'listing-id-123',
    nullable: true,
  })
  productListingId!: string | null;

  @ApiProperty({ example: 5 })
  quantity!: number;

  @ApiProperty({ example: 'organic-tomato' })
  slug!: string;

  @ApiProperty({ example: 1 })
  weightValue!: number;

  @ApiProperty({
    example: 'kg',
    enum: ['g', 'kg', 'l', 'ml'],
  })
  weightUnit!: 'g' | 'kg' | 'l' | 'ml';

  @ApiProperty({
    example: 'variant-id-123',
    nullable: true,
  })
  productVariantId!: string | null;
}

export class DisplayOrderDetailsResponseDto {
  @ApiProperty({ example: 'ORD-123456' })
  id!: string;

  @ApiProperty({ example: '2026-08-19T07:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: true })
  isPayment!: boolean;

  @ApiProperty({
    example: 'display',
    enum: ['display', 'inventory'],
  })
  type!: 'display' | 'inventory';

  @ApiProperty({ example: 'user-id-123' })
  userId!: string;

  @ApiProperty({
    example: 'pending',
    enum: ['delivered', 'pending', 'processing', 'cancelled'],
    nullable: true,
  })
  displayOrderStatus!:
    'delivered' | 'pending' | 'processing' | 'cancelled' | null;

  @ApiProperty({ type: [DisplayOrderItemDto] })
  items!: DisplayOrderItemDto[];
}
