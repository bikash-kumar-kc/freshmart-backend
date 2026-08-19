import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RolesGuard } from '../auth/role.guard';
import { NotificationService } from './notification.service';
import { Roles } from '../auth/role.decorator';
import type { Request } from 'express';
import { IPayloadType } from '../auth/types/token.type';
import {
  NotificationUnreadCountResponseDto,
  VendorNotificationListResponseDto,
} from './dto/response.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationService) {}

  @Get('vendor')
  @Roles('vendor')
  @ApiOperation({ summary: 'Vendor views their own notifications' })
  @ApiOkResponse({
    type: VendorNotificationListResponseDto,
    example: {
      notifications: [
        {
          id: 1,
          message: 'Your product has been approved.',
          content: 'The product Organic Tomato was approved by admin.',
          type: 'vendor',
          vendorId: 'vendor-id-123',
          createdAt: '2026-08-19T08:00:00.000Z',
          subType: 'product_approved',
          referenceId: '123',
          referenceType: 'product',
          isRead: false,
          readAt: null,
        },
      ],
    },
  })
  findAllForVendor(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.notificationsService.findAllForVendor(vendorId as string);
  }

  @Get('vendor/latest')
  @Roles('vendor')
  @ApiOperation({
    summary: 'Vendor views their own notifications within 24hrs',
  })
  @ApiOkResponse({
    type: VendorNotificationListResponseDto,
    example: {
      notifications: [
        {
          id: 1,
          message: 'Your product has been approved.',
          content: 'The product Organic Tomato was approved by admin.',
          type: 'vendor',
          vendorId: 'vendor-id-123',
          createdAt: '2026-08-19T08:00:00.000Z',
          subType: 'product_approved',
          referenceId: '123',
          referenceType: 'product',
          isRead: false,
          readAt: null,
        },
      ],
    },
  })
  vendorNotificationWithinADay(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.notificationsService.findNotificationForADayVendor(
      vendorId as string,
    );
  }

  @Get('admin')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin views the shared admin notification feed' })
  findAllForAdmin() {
    return this.notificationsService.findAllForAdmin();
  }

  @Get('vendor/unread-count')
  @Roles('vendor')
  @ApiOperation({ summary: "Vendor's unread notification count" })
  unreadCountVendor(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.notificationsService.unreadCountForVendor(vendorId as string);
  }

  @Get('admin/unread-count')
  @Roles('admin')
  @ApiOperation({ summary: "Admin's unread notification count (shared)" })
  @ApiOkResponse({
    type: NotificationUnreadCountResponseDto,
    example: {
      unreadCount: 5,
    },
  })
  unreadCountAdmin() {
    return this.notificationsService.unreadCountForAdmin();
  }

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary:
      'Admin manually creates a notification (e.g. to notify a vendor about a quotation)',
  })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Patch(':id')
  @Roles('vendor', 'admin')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markAsRead(@Param('id') id: string, @Req() req: Request) {
    const { role, vendorId } = req['user'] as IPayloadType;
    return this.notificationsService.markAsRead(Number(id), { role, vendorId });
  }
}
