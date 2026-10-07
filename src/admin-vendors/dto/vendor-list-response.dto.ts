// admin-vendors/dto/vendor-list-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

class VendorLocationDto {
  @ApiProperty() ward?: string;
  @ApiProperty() municipality?: string;
  @ApiProperty() district?: string;
  @ApiProperty() province?: string;
  @ApiProperty() country?: string;
}

export class VendorListItemDto {
  @ApiProperty() farmId?: string;
  @ApiProperty() farmName?: string;
  @ApiProperty({ type: VendorLocationDto }) location?: VendorLocationDto;
  @ApiProperty() email?: string;
  @ApiProperty() phone?: string;
  @ApiProperty({ enum: ['approved', 'unapproved', 'deleted'] }) status?: string;
  @ApiProperty() createdAt?: string;
}
