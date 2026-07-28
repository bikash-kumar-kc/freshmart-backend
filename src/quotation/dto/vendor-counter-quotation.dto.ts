import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class VariantCounterDto {
  @ApiProperty() @IsInt() quotationVariantId!: number;
  @ApiProperty() @IsInt() vendorCounterPricePerUnit!: number;
}

export class IVendorCounterQuotationDto {
  @ApiProperty({ type: [VariantCounterDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VariantCounterDto)
  variants!: VariantCounterDto[];
}
