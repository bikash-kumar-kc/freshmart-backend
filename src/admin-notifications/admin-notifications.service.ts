// admin-notifications/admin-notifications.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DB_PROVIDER } from '../db/db.provider';
import * as schema from '../db/schema';
import { notificationsVendorAdmin as n, quotations } from '../db/schema';
import { AdminNotificationListQueryDto } from './dto/admin-notification.dto';
import {
  pillSubTypeSql,
  quotationJoinOn,
  resolveReferenceType,
} from './utils/admin-notification.utils';
import { toIsoUtc } from '../comman/utils/timestamp.utils';

@Injectable()
export class AdminNotificationsService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async list(query: AdminNotificationListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const pill = query.pill ?? 'all';

    const conditions = [eq(n.type, 'admin'), isNotNull(pillSubTypeSql)];
    if (pill === 'read') conditions.push(eq(n.isRead, true));
    else if (pill === 'unread') conditions.push(eq(n.isRead, false));
    else if (pill !== 'all') conditions.push(eq(pillSubTypeSql, pill));
    const where = and(...conditions);

    const [{ total }] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(n)
      .leftJoin(quotations, quotationJoinOn)
      .where(where);

    const rows = await this.db
      .select({
        id: n.id,
        subType: pillSubTypeSql,
        message: n.message,
        isRead: n.isRead,
        referenceId: n.referenceId,
        joinedQuotationId: quotations.id,
        createdAt: n.createdAt,
      })
      .from(n)
      .leftJoin(quotations, quotationJoinOn)
      .where(where)
      .orderBy(desc(n.createdAt), desc(n.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      data: rows.map((r) => {
        const referenceType = resolveReferenceType(
          r.subType!,
          r.referenceId,
          r.joinedQuotationId,
        );
        return {
          id: String(r.id),
          subType: r.subType!,
          message: r.message,
          isRead: r.isRead,
          referenceType,
          referenceId: referenceType ? r.referenceId : null,
          createdAt: toIsoUtc(r.createdAt),
        };
      }),
      total: Number(total),
      page,
      pageSize,
    };
  }

  async unreadCount() {
    const [{ count }] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(n)
      .leftJoin(quotations, quotationJoinOn)
      .where(
        and(
          eq(n.type, 'admin'),
          eq(n.isRead, false),
          isNotNull(pillSubTypeSql),
        ),
      );

    return { unreadCount: Number(count) };
  }

  async setRead(id: number, isRead: boolean) {
    const [updated] = await this.db
      .update(n)
      .set({ isRead, readAt: isRead ? sql`(current_timestamp)` : null })
      .where(and(eq(n.id, id), eq(n.type, 'admin'))) // this route can't touch vendor notifications
      .returning({ id: n.id, isRead: n.isRead });

    if (!updated) throw new NotFoundException('Notification not found');
    return { id: String(updated.id), isRead: updated.isRead };
  }
}
