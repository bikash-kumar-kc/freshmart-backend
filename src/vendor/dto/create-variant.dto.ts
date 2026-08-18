import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class ICreateVariantDto {
  @ApiProperty({ example: 500 })
  @IsInt()
  @IsPositive()
  size!: number;

  @ApiProperty({ example: 1, description: 'FK to measurement_type' })
  @IsInt()
  @IsPositive()
  measurementId!: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiProperty({
    example: 250,
    description: "Vendor's price — required for both Inventory & Display",
  })
  @IsInt()
  @IsPositive()
  pricePerUnit!: number;

  @ApiProperty({
    required: false,
    example: 300,
    description: 'Max customer price — required only if type = inventory',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  sellingPrice?: number;
}
