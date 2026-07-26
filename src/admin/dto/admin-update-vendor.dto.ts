import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUrl } from 'class-validator';

export class IAdminUpdateVendorDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  farmName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  farmOriginCountry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  farmDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  farmOwner?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  addressLocation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vatNumber?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  panVatCertificateUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  certificates?: string[];
}
