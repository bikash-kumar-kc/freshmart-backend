// vendors/dto/apply-vendor.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUrl,
} from 'class-validator';

export class ApplyVendorDto {
  @ApiProperty({ example: 'vendor@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  farmName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  farmOriginCountry!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  farmDescription?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  farmOwner!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  addressLocation!: string;

  @ApiPropertyOptional()
  @IsString()
  vatNumber?: string;

  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  panVatCertificateUrl!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  certificates?: string[];
}
