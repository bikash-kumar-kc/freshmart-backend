import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ISearchProductListingQueryDto {
  @ApiProperty({
    example: 'Apple',
    description: 'Search text — matched against product name or listing ID',
  })
  @IsString()
  @IsNotEmpty()
  q!: string;
}
