// notifications/notifications.controller.ts
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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RolesGuard } from '../auth/role.guard';
import { NotificationService } from './notification.service';
import { Roles } from '../auth/role.decorator';
import type { Request } from 'express';
import { IPayloadType } from '../auth/types/token.type';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationService) {}

  @Get('vendor')
  @Roles('vendor')
  @ApiOperation({ summary: 'Vendor views their own notifications' })
  findAllForVendor(@Req() req: Request) {
    const { vendorId } = req['user'] as IPayloadType;
    return this.notificationsService.findAllForVendor(vendorId as string);
  }

  @Get('vendor/latest')
  @Roles('vendor')
  @ApiOperation({
    summary: 'Vendor views their own notifications within 24hrs',
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

  @Patch(':id/read')
  @Roles('vendor', 'admin')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markAsRead(@Param('id') id: string, @Req() req: Request) {
    const { role, vendorId } = req['user'] as IPayloadType;
    return this.notificationsService.markAsRead(Number(id), { role, vendorId });
  }
}
