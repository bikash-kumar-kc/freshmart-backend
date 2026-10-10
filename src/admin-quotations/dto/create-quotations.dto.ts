// admin-quotations/dto/create-quotations.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuotationVariantInputDto {
  @ApiProperty() @Type(() => Number) @IsInt() @IsPositive() variantId?: number;
  @ApiProperty({
    description:
      'Price the admin is requesting, must not exceed the vendor price',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  adminSuggested?: number;
  @ApiProperty() @Type(() => Number) @IsInt() @IsPositive() quantity?: number;
}

export class QuotationInputDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  productListingId?: number;

  @ApiProperty({ type: [QuotationVariantInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationVariantInputDto)
  variants?: QuotationVariantInputDto[];
}

export class CreateQuotationsDto {
  @ApiProperty() @IsString() @IsNotEmpty() vendorId?: string;

  @ApiProperty({
    type: [QuotationInputDto],
    description: 'One quotation is created per entry',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationInputDto)
  quotations?: QuotationInputDto[];
}
