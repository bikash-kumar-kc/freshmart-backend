import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class PasswordResetDto {
  @ApiProperty({ example: 'name@example.com' })
  @IsEmail()
  email!: string;
}
