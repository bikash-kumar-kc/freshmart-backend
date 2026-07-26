import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBooleanString } from 'class-validator';

export class IListVendorsQueryDto {
  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsBooleanString()
  emailVerified?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsBooleanString()
  approved?: string;
}
