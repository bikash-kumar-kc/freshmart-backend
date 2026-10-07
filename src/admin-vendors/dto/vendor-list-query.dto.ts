// admin-vendors/dto/vendor-list-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class VendorListQueryDto {
  @ApiPropertyOptional({ enum: ['all', 'approved', 'unapproved', 'deleted'] })
  @IsOptional()
  @IsIn(['all', 'approved', 'unapproved', 'deleted'])
  status?: string = 'all';

  @ApiPropertyOptional({ description: 'Search by vendor ID or farm name' })
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
