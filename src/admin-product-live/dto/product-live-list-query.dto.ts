// admin-product-live/dto/product-live-list-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductLiveListQueryDto {
  @ApiPropertyOptional({
    enum: ['all', 'in_stock', 'low_stock', 'out_of_stock'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'in_stock', 'low_stock', 'out_of_stock'])
  stock?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' = 'all';

  @ApiPropertyOptional({ enum: ['all', 'draft', 'live'], default: 'all' })
  @IsOptional()
  @IsIn(['all', 'draft', 'live'])
  live?: 'all' | 'draft' | 'live' = 'all';

  @ApiPropertyOptional({
    enum: ['all', 'inventory', 'display'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'inventory', 'display'])
  type?: 'all' | 'inventory' | 'display' = 'all';

  @ApiPropertyOptional({ description: 'Matches product ID only' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}
