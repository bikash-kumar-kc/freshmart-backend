// admin-product-listing/dto/product-listing-list-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductListingListQueryDto {
  @ApiPropertyOptional({
    enum: ['all', 'approved', 'unapproved'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'approved', 'unapproved'])
  status?: 'all' | 'approved' | 'unapproved' = 'all';

  @ApiPropertyOptional({
    enum: ['all', 'inventory', 'display'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'inventory', 'display'])
  type?: 'all' | 'inventory' | 'display' = 'all';

  @ApiPropertyOptional({
    enum: ['new_to_old', 'old_to_new'],
    default: 'new_to_old',
  })
  @IsOptional()
  @IsIn(['new_to_old', 'old_to_new'])
  sort?: 'new_to_old' | 'old_to_new' = 'new_to_old';

  @ApiPropertyOptional({
    description: 'Matches listing ID, farm name or product name',
  })
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
