import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuotationVariantInputDto {
  @ApiProperty() @IsInt() productListingVariantId!: number;
  @ApiProperty() @IsInt() adminSuggestedPricePerUnit!: number;
  @ApiProperty() @IsInt() quantity!: number;
}

export class CreateQuotationDto {
  @ApiProperty() @IsInt() productListingId!: number;

  @ApiProperty({ type: [QuotationVariantInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationVariantInputDto)
  variants!: QuotationVariantInputDto[];
}
