import { ApiProperty } from '@nestjs/swagger';

export class VendorNotificationDto {
  @ApiProperty({ example: 'Your product has been approved.' })
  message!: string;

  @ApiProperty({
    example: 'Additional details about the notification.',
    nullable: true,
  })
  content!: string | null;

  @ApiProperty({
    example: 'vendor',
    enum: ['admin', 'vendor'],
  })
  type!: 'admin' | 'vendor';

  @ApiProperty({
    example: 'vendor-id-123',
    nullable: true,
  })
  vendorId!: string | null;

  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({
    example: '2026-08-19T08:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    example: 'product_approved',
    enum: [
      'vendor_registration_filed',
      'vendor_account_created',
      'vendor_added_product',
      'vendor_edited_product',
      'vendor_suggested_product_name',
      'vendor_replied_quotation',
      'product_approved',
      'product_rejected',
      'admin_filed_quotation',
      'display_order_request',
      'quotation_deleted',
    ],
  })
  subType!:
    | 'vendor_registration_filed'
    | 'vendor_account_created'
    | 'vendor_added_product'
    | 'vendor_edited_product'
    | 'vendor_suggested_product_name'
    | 'vendor_replied_quotation'
    | 'product_approved'
    | 'product_rejected'
    | 'admin_filed_quotation'
    | 'display_order_request'
    | 'quotation_deleted';

  @ApiProperty({
    example: '123',
    nullable: true,
  })
  referenceId!: string | null;

  @ApiProperty({
    example: 'product',
    nullable: true,
  })
  referenceType!: string | null;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiProperty({
    example: '2026-08-19T08:10:00.000Z',
    nullable: true,
  })
  readAt!: string | null;
}

export class VendorNotificationListResponseDto {
  @ApiProperty({ type: [VendorNotificationDto] })
  notifications!: VendorNotificationDto[];
}

export class NotificationUnreadCountResponseDto {
  @ApiProperty({ example: 5 })
  unreadCount!: number;
}
