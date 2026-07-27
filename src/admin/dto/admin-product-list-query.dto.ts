import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBooleanString } from 'class-validator';

export class IAdminListProductListingQueryDto {
  @ApiPropertyOptional({ example: 'false' })
  @IsOptional()
  @IsBooleanString()
  verified?: string;
}
