// admin-product-live/dto/update-product-live-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateProductLiveStatusDto {
  @ApiProperty({ enum: ['live', 'draft'] })
  @IsIn(['live', 'draft'])
  status?: 'live' | 'draft';
}
