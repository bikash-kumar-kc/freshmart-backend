import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyPasswordResetDto {
  @ApiProperty({ example: 'token@123' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
