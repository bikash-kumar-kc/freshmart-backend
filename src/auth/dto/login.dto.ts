import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'name@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'differentiating vendor/admin' })
  @IsBoolean()
  isVendor!: boolean;
}
