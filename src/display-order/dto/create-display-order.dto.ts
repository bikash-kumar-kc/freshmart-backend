// display-order/dto/create-display-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateDisplayOrderDto {
  @ApiProperty() @IsInt() @IsPositive() productVariantId!: number;
  @ApiProperty() @IsInt() @IsPositive() quantity!: number;
}
