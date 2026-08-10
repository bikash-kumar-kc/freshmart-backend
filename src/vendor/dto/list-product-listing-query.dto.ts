import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBooleanString, IsInt, IsOptional, Min } from 'class-validator';

export class IListProductListingQueryDto {
  @ApiProperty({
    example: 'true',
    description: 'Filter by admin-approval status',
  })
  @IsBooleanString()
  verified!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
