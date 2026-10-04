// admin-dashboard/dto/top-product-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopProductResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Null for original, non-vendor-sourced products',
  })
  vendorId!: string | null;
  @ApiProperty() name!: string;
  @ApiProperty() image!: string;
  @ApiPropertyOptional({ nullable: true }) type!:
    'inventory' | 'display' | null;
  @ApiProperty() sales!: number;
  @ApiProperty() earning!: number;
  @ApiProperty() stock!: number;
  @ApiProperty({ enum: ['in_stock', 'low_stock', 'out_of_stock'] })
  status!: string;
}
