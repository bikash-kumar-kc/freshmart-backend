// admin-orders/dto/update-inventory-order-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateInventoryOrderStatusDto {
  @ApiProperty({ enum: ['ontheway', 'delivered', 'failed'] })
  @IsIn(['ontheway', 'delivered', 'failed'])
  status?: 'ontheway' | 'delivered' | 'failed';
}
