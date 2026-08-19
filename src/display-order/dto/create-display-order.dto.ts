import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ItemsDisplayOrderDto {
  @ApiProperty() @IsString() productVariantId!: string;
  @ApiProperty() @IsInt() @IsPositive() quantity!: number;
}

export class CreateDisplayOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  vendorId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemsDisplayOrderDto)
  items!: ItemsDisplayOrderDto[];
}

export type Order = {
  orderId: string;
  userId: string;
  email: string;
  vendorId: string;
  displayOrderStatus: string;
  type: 'display';
  isPayment: boolean;
  createdAt: string;
};
