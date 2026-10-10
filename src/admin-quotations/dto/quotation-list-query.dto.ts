// admin-quotations/dto/quotation-list-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QuotationListQueryDto {
  @ApiPropertyOptional({
    enum: ['approved', 'unapproved'],
    default: 'approved',
  })
  @IsOptional()
  @IsIn(['approved', 'unapproved'])
  bucket?: 'approved' | 'unapproved' = 'approved';

  @ApiPropertyOptional({
    enum: [
      'all',
      'approved',
      'delivered',
      'pending',
      'cancelled',
      'rechecking',
      'countered',
    ],
    default: 'all',
  })
  @IsOptional()
  @IsIn([
    'all',
    'approved',
    'delivered',
    'pending',
    'cancelled',
    'rechecking',
    'countered',
  ])
  subStatus?: string = 'all';

  @ApiPropertyOptional({ description: 'Quotation ID' })
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
