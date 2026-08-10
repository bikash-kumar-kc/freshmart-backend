// product-listing/dto/update-product-listing.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  ArrayMinSize,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ICreateVariantDto } from './create-variant.dto';
import { IProductType } from '../types/product.type';
import { IImage } from '../../db/schema';

export class IUpdateProductListingDto {
  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({ enum: IProductType })
  @IsEnum(IProductType)
  @IsOptional()
  type?: IProductType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  localName?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  categoryId?: number;

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
  @IsOptional()
  images?: IImage[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  originCountry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  farmName?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  packagingTypeId?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean;

  @ApiPropertyOptional({ type: [ICreateVariantDto] })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ICreateVariantDto)
  variants?: ICreateVariantDto[];

  // vendorId and isAcceptedByAdmin are excluded...
}
