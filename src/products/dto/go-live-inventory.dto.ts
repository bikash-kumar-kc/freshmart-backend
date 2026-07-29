import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

class VariantQuantityOverrideDto {
  @ApiProperty() @IsInt() quotationVariantId!: number;
  @ApiProperty() @IsInt() @IsPositive() quantity!: number;
}

export class GoLiveInventoryDto {
  @ApiProperty({ type: [VariantQuantityOverrideDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VariantQuantityOverrideDto)
  variantQuantities!: VariantQuantityOverrideDto[];
}
