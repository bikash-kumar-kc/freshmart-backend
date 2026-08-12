// display-order/dto/create-display-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  ValidateNested,
} from 'class-validator';

export class ItemsDisplayOrderDto {
  @ApiProperty() @IsInt() @IsPositive() productVariantId!: number;
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

type OrderItem = {
  productId: string;
  productName: string;
  localName: string | null;
  slug: string;
  variantId: string;
  weightValue: number;
  weightUnit: 'g' | 'kg' | 'l' | 'ml';
  quantity: number;
};

export type Order = {
  orderId: string;
  userId: string;
  email: string;
  displayOrderStatus: string;
  type: 'display';
  isPayment: boolean;
  items: OrderItem[];
};
