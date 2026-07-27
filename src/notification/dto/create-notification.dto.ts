import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import type { INotificationSubType } from '../utilis/notification.type';

export class CreateNotificationDto {
  @ApiProperty({ enum: ['vendor', 'admin'] })
  @IsEnum(['vendor', 'admin'])
  type!: 'vendor' | 'admin';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subType!: INotificationSubType;

  @ApiPropertyOptional({ description: 'Required when type = vendor' })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;
}
