// admin-notifications/dto/admin-notification.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const ADMIN_NOTIFICATION_PILLS = [
  'all',
  'unread',
  'read',
  'inventory_order',
  'quotation_countered',
  'quotation_approved',
  'vendor_registration',
  'productListed',
] as const;

export class AdminNotificationListQueryDto {
  @ApiPropertyOptional({ enum: ADMIN_NOTIFICATION_PILLS, default: 'all' })
  @IsOptional()
  @IsIn([...ADMIN_NOTIFICATION_PILLS])
  pill?: (typeof ADMIN_NOTIFICATION_PILLS)[number] = 'all';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}

export class SetNotificationReadDto {
  @ApiProperty({
    description: 'Target state: true marks read, false marks unread',
  })
  @IsBoolean()
  isRead?: boolean;
}

export class AdminNotificationItemDto {
  @ApiProperty() id?: string;
  @ApiProperty({ enum: ADMIN_NOTIFICATION_PILLS.slice(3) }) subType?: string;
  @ApiProperty() message?: string;
  @ApiProperty() isRead?: boolean;
  @ApiProperty({
    enum: ['quotation', 'vendor', 'productListing'],
    nullable: true,
  })
  referenceType?: string | null;
  @ApiProperty({ nullable: true }) referenceId?: string | null;
  @ApiProperty({ description: 'ISO 8601, UTC' }) createdAt?: string;
}

export class AdminNotificationListResponseDto {
  @ApiProperty({ type: [AdminNotificationItemDto] })
  data?: AdminNotificationItemDto[];
  @ApiProperty() total?: number;
  @ApiProperty() page?: number;
  @ApiProperty() pageSize?: number;
}
