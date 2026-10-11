// admin-notifications/admin-notifications.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminNotificationsService } from './admin-notifications.service';
import {
  AdminNotificationListQueryDto,
  AdminNotificationListResponseDto,
  SetNotificationReadDto,
} from './dto/admin-notification.dto';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';

@ApiTags('Admin - Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly service: AdminNotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Shared admin inbox, filterable by read state or subtype',
  })
  @ApiOkResponse({ type: AdminNotificationListResponseDto })
  list(@Query() query: AdminNotificationListQueryDto) {
    return this.service.list(query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread count for the bell badge (polled)' })
  unreadCount() {
    return this.service.unreadCount();
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Set a notification to read or unread (idempotent)',
  })
  setRead(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetNotificationReadDto,
  ) {
    return this.service.setRead(id, dto.isRead as boolean);
  }
}
