import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class InventoryOrderQueryDto {
  @ApiPropertyOptional({
    enum: ['all', 'packaging', 'ontheway', 'delivered', 'failed'],
  })
  @IsOptional()
  @IsIn(['all', 'packaging', 'ontheway', 'delivered', 'failed'])
  status?: string = 'all';

  @ApiPropertyOptional({ description: 'Search by order ID' })
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
  pageSize?: number = 10;
}
