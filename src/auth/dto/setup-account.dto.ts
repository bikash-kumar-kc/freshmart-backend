import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsString, MinLength } from 'class-validator';

export class SetupAccountDto {
  @ApiProperty({ example: 'name@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isVendor!: boolean;
}
