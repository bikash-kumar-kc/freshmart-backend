import { ApiProperty } from '@nestjs/swagger';

export class VendorListDto {
  @ApiProperty({ example: 'randomId' })
  id!: string;

  @ApiProperty({ example: 'vendor@example.com' })
  email!: string;

  @ApiProperty({ example: 'Green Valley Farm' })
  farmName!: string;

  @ApiProperty({ example: true })
  isVendorApproved!: boolean;

  @ApiProperty({ example: true })
  isEmailVerified!: boolean;
}

export class VendorApprovedResponseDto {
  @ApiProperty({ example: 'randomId' })
  id!: string;

  @ApiProperty({ example: true })
  isVendorApproved!: boolean;
}
