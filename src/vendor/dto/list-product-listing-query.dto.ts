import { ApiProperty } from '@nestjs/swagger';
import { IsBooleanString } from 'class-validator';

export class IListProductListingQueryDto {
  @ApiProperty({
    example: 'true',
    description: 'Filter by admin-approval status',
  })
  @IsBooleanString()
  verified!: string;
}
