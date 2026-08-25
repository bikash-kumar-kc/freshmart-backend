import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class PasswordResetDto {
  @ApiProperty({ example: 'name@example.com' })
  @IsEmail()
  email!: string;
}

export class VerifyPasswordResetDto {
  @ApiProperty({ example: 'password123' })
  @IsString()
  password!: string;

  @ApiProperty({ example: 'token123' })
  @IsString()
  token!: string;
}
