import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
  ValidateNested,
  ArrayMinSize,
  IsBoolean,
  Validate,
} from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ICreateVariantDto } from './create-variant.dto';
import { IProductType } from '../types/product.type';
import { IImage } from '../../db/schema';

@ValidatorConstraint({ name: 'variantSellingPrice' })
export class VariantSellingPriceValidator implements ValidatorConstraintInterface {
  validate(dto: ICreateProductListingDto) {
    if (dto.type === IProductType.INVENTORY) {
      for (const variant of dto.variants) {
        if (!variant.sellingPrice) {
          return false;
        }
      }
    }

    return true;
  }
}

export class ICreateProductListingDto {
  @ApiProperty({ example: 1, description: 'FK to product_name' })
  @IsInt()
  productId!: number;

  @ApiProperty({ enum: IProductType })
  @IsEnum(IProductType)
  type!: IProductType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  localName?: string;

  @ApiProperty({ example: 1, description: 'FK to category' })
  @IsInt()
  categoryId!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keywords?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  images!: IImage[];

  @ApiProperty({ example: 'Nepal' })
  @IsString()
  @IsNotEmpty()
  originCountry!: string;

  @ApiPropertyOptional() @IsString() @IsOptional() farmName?: string;

  @ApiProperty({ example: 1, description: 'FK to packaging_type' })
  @IsInt()
  packagingTypeId!: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean;

  @ApiProperty({
    type: [ICreateVariantDto],
    description: 'One or more variants (size/measurement/price combinations)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ICreateVariantDto)
  @Validate(VariantSellingPriceValidator)
  variants!: ICreateVariantDto[];
}
