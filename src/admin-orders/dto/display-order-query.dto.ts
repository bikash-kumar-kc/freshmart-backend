// admin-orders/dto/display-order-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DisplayOrderQueryDto {
  @ApiPropertyOptional({
    enum: ['all', 'pending', 'processing', 'delivered', 'cancelled'],
  })
  @IsOptional()
  @IsIn(['all', 'pending', 'processing', 'delivered', 'cancelled'])
  status?: string = 'all';

  @ApiPropertyOptional()
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
