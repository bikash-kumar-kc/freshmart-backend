// admin-dashboard/dto/top-products-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum TopProductsPeriod {
  WEEK = 'week',
  MONTH = 'month',
}

export enum ProductStockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

export class TopProductsQueryDto {
  @ApiPropertyOptional({
    enum: TopProductsPeriod,
    default: TopProductsPeriod.WEEK,
  })
  @IsOptional()
  @IsEnum(TopProductsPeriod)
  period?: TopProductsPeriod = TopProductsPeriod.WEEK;

  @ApiPropertyOptional({
    enum: ProductStockStatus,
    description: 'Filter the top-5 result by stock status',
  })
  @IsOptional()
  @IsEnum(ProductStockStatus)
  status?: ProductStockStatus;
}
