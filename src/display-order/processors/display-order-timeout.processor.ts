import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_PROVIDER } from '../../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../../db/schema';
import { orders } from '../../db/schema';
import { NotificationService } from '../../notification/notification.service';

@Processor('display-order-timeout')
export class DisplayOrderTimeoutProcessor extends WorkerHost {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly notificationsService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<{ orderId: string }>) {
    const order = await this.db.query.orders.findFirst({
      where: eq(orders.id, job.data.orderId),
    });
    if (!order || order.displayOrderStatus !== 'pending') return;

    await this.db
      .update(orders)
      .set({ displayOrderStatus: 'delivered' })
      .where(eq(orders.id, order.id));

    await this.notificationsService.create({
      type: 'vendor',
      subType: 'display_order_request',
      vendorId: order.vendorId!,
      referenceId: String(order.id),
      referenceType: 'order',
      message: `Order #${order.id} was auto-marked as delivered after no response within 1 hour`,
    });
  }
}
