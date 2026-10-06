// admin-orders/admin-inventory-orders.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, like, sql, ne } from 'drizzle-orm';

import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../../db/schema';
import {
  orders,
  orderItems,
  users,
  products,
  productVariants,
} from '../../db/schema';

import { isValidInventoryTransition } from '../state-machine/inventory-order-status.machine';
import { DB_PROVIDER } from '../../db/db.provider';
import { InventoryOrderQueryDto } from '../dto/inventory-order-query.dto';
import { UpdateInventoryOrderStatusDto } from '../dto/update-inventory-order-status.dto';

@Injectable()
export class AdminInventoryOrdersService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async list(query: InventoryOrderQueryDto) {
    const conditions = [
      eq(orders.type, 'inventory'),
      ne(orders.orderStatus, 'pending'),
    ];

    if (query.status && query.status !== 'all') {
      conditions.push(eq(orders.orderStatus, query.status as any));
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
        status: orders.orderStatus,
        totalPrice: orders.totalPrice,
        totalPriceAfterDiscount: orders.totalPriceAfterDiscount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .where(whereClause)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Aggregate totalItems/totalQuantity per order
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
        discount:
          r.totalPrice && r.totalPriceAfterDiscount
            ? r.totalPrice - r.totalPriceAfterDiscount
            : null,
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
    if (!order || order.type !== 'inventory')
      throw new NotFoundException('Order not found');

    const customer = await this.db.query.users.findFirst({
      where: eq(users.id, order.userId),
    });

    const items = await this.db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        image: products.thumbnail,
        quantity: orderItems.quantity,
        weightValue: orderItems.weightValue,
        weightUnit: orderItems.weightUnit,
        price: productVariants.price,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(
        productVariants,
        eq(orderItems.productVariantId, productVariants.id),
      )
      .where(eq(orderItems.orderId, orderId));

    const updatedOrder = {
      ...order,
      orderId: order.id,
    };

    return { order: updatedOrder, customer, items };
  }

  async updateStatus(orderId: string, dto: UpdateInventoryOrderStatusDto) {
    const order = await this.db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });
    if (!order || order.type !== 'inventory')
      throw new NotFoundException('Order not found');

    if (
      !order.orderStatus ||
      !isValidInventoryTransition(order.orderStatus, dto.status as string)
    ) {
      throw new BadRequestException(
        `Cannot transition order from "${order.orderStatus}" to "${dto.status}"`,
      );
    }

    const [updated] = await this.db
      .update(orders)
      .set({
        orderStatus: dto.status,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(orders.id, orderId))
      .returning();

    return updated;
  }
}
