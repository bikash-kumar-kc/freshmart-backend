import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class SetupAccountDto {
  @ApiProperty({ example: 'name@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isVendor!: boolean;

  @ApiProperty({ example: 'vendorId' })
  @IsString()
  vendorId!: string;
}
