import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { DB_PROVIDER } from '../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { and, count, eq, gte, sql } from 'drizzle-orm';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  // notification creates...
  async create(dto: CreateNotificationDto) {
    const [notification] = await this.db
      .insert(schema.notificationsVendorAdmin)
      .values(dto)
      .returning();
    return notification;
  }

  // vendor gets all notification specific to it...
  findAllForVendor(vendorId: string) {
    return this.db.query.notificationsVendorAdmin.findMany({
      where: and(
        eq(schema.notificationsVendorAdmin.type, 'vendor'),
        eq(schema.notificationsVendorAdmin.vendorId, vendorId),
      ),
      orderBy: (n, { desc }) => [desc(n.createdAt)],
    });
  }

  // admin gets all notification specific to it...
  async findAllForAdmin() {
    return this.db.query.notificationsVendorAdmin.findMany({
      where: eq(schema.notificationsVendorAdmin.type, 'admin'),
      orderBy: (n, { desc }) => [desc(n.createdAt)],
    });
  }

  // vendor gets count of notification that is not marked as read...
  async unreadCountForVendor(vendorId: string) {
    const [result] = await this.db
      .select({ count: count() })
      .from(schema.notificationsVendorAdmin)
      .where(
        and(
          eq(schema.notificationsVendorAdmin.type, 'vendor'),
          eq(schema.notificationsVendorAdmin.vendorId, vendorId),
          eq(schema.notificationsVendorAdmin.isRead, false),
        ),
      );
    return { unreadCount: result.count };
  }

  // admin gets count of notification that is not marked as read...
  async unreadCountForAdmin() {
    const [result] = await this.db
      .select({ count: count() })
      .from(schema.notificationsVendorAdmin)
      .where(
        and(
          eq(schema.notificationsVendorAdmin.type, 'admin'),
          eq(schema.notificationsVendorAdmin.isRead, false),
        ),
      );
    return { unreadCount: result.count };
  }

  // notification is read by the admin/vendor...
  async markAsRead(
    id: number,
    requester: { role: string; vendorId: string | null },
  ) {
    const notification = await this.db.query.notificationsVendorAdmin.findFirst(
      {
        where: eq(schema.notificationsVendorAdmin.id, id),
      },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (
      notification.type === 'vendor' &&
      notification.vendorId !== requester.vendorId
    ) {
      throw new ForbiddenException('You do not own this notification');
    }

    await this.db
      .update(schema.notificationsVendorAdmin)
      .set({ isRead: true, readAt: sql`(current_timestamp)` })
      .where(eq(schema.notificationsVendorAdmin.id, id))
      .returning();

    return { message: 'notififcation got read' };
  }

  // vendor gets notification within 24hrs...
  async findNotificationForADayVendor(vendorId: string) {
    return this.db
      .select()
      .from(schema.notificationsVendorAdmin)
      .where(
        and(
          eq(schema.notificationsVendorAdmin.vendorId, vendorId),
          eq(schema.notificationsVendorAdmin.type, 'vendor'),
          eq(schema.notificationsVendorAdmin.isRead, false),
          gte(
            schema.notificationsVendorAdmin.createdAt,
            sql`datetime('now', '-24 hours')`,
          ),
        ),
      );
  }
}
