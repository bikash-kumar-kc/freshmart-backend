// admin-orders/admin-display-orders.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, like, sql } from 'drizzle-orm';
import { DB_PROVIDER } from '../../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../../db/schema';
import { orders, orderItems, users, vendors, products } from '../../db/schema';
import { DisplayOrderQueryDto } from '../dto/display-order-query.dto';

@Injectable()
export class AdminDisplayOrdersService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async list(query: DisplayOrderQueryDto) {
    const conditions = [eq(orders.type, 'display')];

    if (query.status && query.status !== 'all') {
      conditions.push(eq(orders.displayOrderStatus, query.status as any));
    }
    if (query.search?.trim()) {
      conditions.push(like(orders.id, `%${query.search.trim()}%`));
    }

    const whereClause = and(...conditions);

    const [{ count: total }] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(whereClause);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const rows = await this.db
      .select({
        orderId: orders.id,
        customerName: users.name,
        farmName: vendors.farmName,
        status: orders.displayOrderStatus,
        confirmationDeadline: orders.vendorConfirmationDeadline,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .leftJoin(vendors, eq(orders.vendorId, vendors.id))
      .where(whereClause)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const orderIds = rows.map((r) => r.orderId);
    const itemAgg =
      orderIds.length > 0
        ? await this.db
            .select({
              orderId: orderItems.orderId,
              totalItems: sql<number>`COUNT(*)`,
              totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
            })
            .from(orderItems)
            .where(sql`${orderItems.orderId} IN ${orderIds}`)
            .groupBy(orderItems.orderId)
        : [];

    const itemMap = new Map(itemAgg.map((i) => [i.orderId, i]));

    return {
      data: rows.map((r) => ({
        ...r,
        totalItems: itemMap.get(r.orderId)?.totalItems ?? 0,
        totalQuantity: itemMap.get(r.orderId)?.totalQuantity ?? 0,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getDetail(orderId: string) {
    const order = await this.db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });
    if (!order || order.type !== 'display')
      throw new NotFoundException('Order not found');

    const customer = await this.db.query.users.findFirst({
      where: eq(users.id, order.userId),
    });
    const vendor = order.vendorId
      ? await this.db.query.vendors.findFirst({
          where: eq(vendors.id, order.vendorId),
        })
      : null;

    const items = await this.db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        image: products.thumbnail,
        quantity: orderItems.quantity,
        weightValue: orderItems.weightValue,
        weightUnit: orderItems.weightUnit,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    const updatedOrder = {
      ...order,
      orderId: order.id,
    };

    return { order: updatedOrder, customer, vendor, items };
  }
}
