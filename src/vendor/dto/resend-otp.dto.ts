import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class IResendOtpDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}
