import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class IVerifyOtpDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '482913' })
  @IsString()
  @Length(6, 6)
  otp!: string;
}
