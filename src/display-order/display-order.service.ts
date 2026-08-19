import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { and, countDistinct, desc, eq, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';
import { CreateDisplayOrderDto, Order } from './dto/create-display-order.dto';
import { NotificationService } from '../notification/notification.service';
import { DB_PROVIDER } from '../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { ORDER_WINDOW } from './utilits/constant/orderResponse.constant';

@Injectable()
export class DisplayOrderService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly notificationsService: NotificationService,
    @InjectQueue('display-order-timeout') private readonly timeoutQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateDisplayOrderDto) {
    const variantIds = dto.items.map((i) => i.productVariantId);

    const variants = await this.db
      .select()
      .from(schema.productVariants)
      .where(inArray(schema.productVariants.id, variantIds));

    if (variants.length === 0) {
      throw new NotFoundException('Product variant not found');
    }

    const availableVariantIds = variants.map((v) => v.id);
    const missingVariant = variantIds.find(
      (id) => !availableVariantIds.includes(String(id)),
    );
    if (missingVariant) {
      throw new NotFoundException(
        `Product variant ${missingVariant} not found`,
      );
    }

    const productIds = [...new Set(variants.map((v) => v.productId))];

    const products = await this.db.query.products.findMany({
      where: inArray(schema.products.id, productIds),
    });

    if (products.length === 0) {
      throw new BadRequestException(
        'These products are not available for direct vendor ordering',
      );
    }

    // Every product must belong to the vendorId the client claims to be ordering from
    const wrongVendorProduct = products.find(
      (p) => p.vendorId !== dto.vendorId,
    );
    if (wrongVendorProduct) {
      throw new BadRequestException(
        'All items in one Display order must belong to the same vendor',
      );
    }

    // Stock check — per item, against the requested quantity

    const variantMap = new Map(
      variants.map((variant) => [variant.id, variant]),
    );

    const isInStock = dto.items.every((item) => {
      const variant = variantMap.get(item.productVariantId);

      if (!variant) {
        return false;
      }

      const availableStock = variant.stock - variant.reservedStock;

      return item.quantity <= availableStock;
    });

    if (!isInStock) {
      throw new BadRequestException('Some of the variant is out of stock');
    }

    const deadline = new Date(
      Date.now() + ORDER_WINDOW.orderResponseTime,
    ).toISOString();

    const order = await this.db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(schema.orders)
        .values({
          userId,
          type: 'display',
          vendorId: dto.vendorId,
          displayOrderStatus: 'pending',
          vendorConfirmationDeadline: deadline,
          isOrdered: true,
        })
        .returning();

      for (const item of dto.items) {
        const variant = variants.find(
          (v) => v.id === String(item.productVariantId),
        )!;
        const product = products.find((p) => p.id === variant.productId)!;

        await tx.insert(schema.orderItems).values({
          orderId: newOrder.id,
          productId: product.id,
          vendorId: dto.vendorId,
          weightValue: variant.weightValue,
          weightUnit: variant.weightUnit as 'g' | 'kg' | 'l' | 'ml',
          quantity: item.quantity,
          slug: product.slug,
          productVariantId: variant.id,
        });

        await tx
          .update(schema.productVariants)
          .set({
            stock: variant.stock - item.quantity,
            reservedStock: variant.reservedStock + item.quantity,
          })
          .where(eq(schema.productVariants.id, variant.id));
      }

      return { orderId: newOrder.id };
    });

    await this.notificationsService.create({
      type: 'vendor',
      subType: 'display_order_request',
      vendorId: dto.vendorId,
      referenceId: String(order.orderId),
      referenceType: 'order',
      message: 'You have a new order — please respond within 1 hour',
    });

    await this.timeoutQueue.add(
      'display-order-timeout',
      { orderId: order.orderId },
      { delay: ORDER_WINDOW.orderResponseTime },
    );
    return order;
  }

  async findAllForVendor(vendorId: string, page = 1, limit = 10) {
    const offset = (page - 1) * 10;

    const [{ totalDisplayOrder }] = await this.db
      .select({
        totalDisplayOrder: countDistinct(schema.orders.id),
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.vendorId, vendorId),
          eq(schema.orders.type, 'display'),
        ),
      );

    const paginatedOrders = await this.db
      .select({
        orderId: schema.orders.id,
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.vendorId, vendorId),
          eq(schema.orders.type, 'display'),
        ),
      )
      .orderBy(desc(schema.orders.createdAt))
      .limit(limit)
      .offset(offset);

    const orderIds = paginatedOrders.map((o) => o.orderId);

    const response = await this.db
      .select({
        orderId: schema.orders.id,
        userId: schema.orders.userId,
        email: schema.users.email,

        vendorId: schema.orders.vendorId,

        displayOrderStatus: schema.orders.displayOrderStatus,
        type: schema.orders.type,
        isPayment: schema.orders.isPayment,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)

      .innerJoin(schema.users, eq(schema.users.id, schema.orders.userId))
      .where(inArray(schema.orders.id, orderIds));

    const orders = Object.values(
      response.reduce(
        (acc, item) => {
          if (!acc[item.orderId]) {
            acc[item.orderId] = {
              orderId: item.orderId,
              userId: item.userId,
              email: item.email,
              vendorId: item.vendorId as string,
              displayOrderStatus: item.displayOrderStatus as
                'pending' | 'processing' | 'delivered' | 'cancelled',
              type: item.type as 'display',
              isPayment: item.isPayment,
              createdAt: item.createdAt,
            };
          }

          return acc;
        },
        {} as Record<string, Order>,
      ),
    );

    return {
      data: [...orders],
      currentPage: page,
      hasNextPage: page < totalDisplayOrder,
      totalPages: Math.ceil(totalDisplayOrder / limit),
      limit,
      totalOrders: totalDisplayOrder,
    };
  }

  async updateStatus(
    orderId: string,
    vendorId: string,
    newStatus: 'processing' | 'delivered',
  ) {
    const order = await this.getOrThrow(orderId, vendorId);
    if (
      order.displayOrderStatus === 'delivered' ||
      order.displayOrderStatus === 'cancelled'
    ) {
      throw new BadRequestException('This order can no longer be cancelled');
    }
    const [updated] = await this.db
      .update(schema.orders)
      .set({
        displayOrderStatus: newStatus,
        isPayment: newStatus === 'delivered' ? true : false,
      })
      .where(eq(schema.orders.id, order.id))
      .returning({ id: schema.orders.id });

    return updated;
  }

  async cancel(orderId: string, vendorId: string) {
    const order = await this.getOrThrow(orderId, vendorId);
    if (
      order.displayOrderStatus === 'delivered' ||
      order.displayOrderStatus === 'cancelled'
    ) {
      throw new BadRequestException('This order can no longer be cancelled');
    }

    return this.db.transaction(async (tx) => {
      const items = await tx.query.orderItems.findMany({
        where: eq(schema.orderItems.orderId, orderId),
      });

      for (const item of items) {
        if (!item.productVariantId) continue;
        const variant = await tx.query.productVariants.findFirst({
          where: eq(schema.productVariants.id, String(item.productVariantId)),
        });
        if (variant) {
          await tx
            .update(schema.productVariants)
            .set({ stock: variant.stock + item.quantity })
            .where(eq(schema.productVariants.id, variant.id));
        }
      }

      const [updated] = await tx
        .update(schema.orders)
        .set({ displayOrderStatus: 'cancelled' })
        .where(eq(schema.orders.id, orderId))
        .returning({ id: schema.orders.id });

      return updated;
    });
  }

  async findOneForVendor(orderId: string, vendorId: string) {
    const order = await this.getOrThrow(orderId, vendorId);
    const items = await this.db.query.orderItems.findMany({
      where: eq(schema.orderItems.orderId, orderId),
    });

    const productVarientIds = items.map((i) => i.productVariantId as string);
    const map = new Map<string, Record<string, string | number>>();

    for (const id of productVarientIds) {
      const [varient] = await this.db
        .select({
          price: schema.productVariants.price,
          productName: schema.productName.name,
          localName: schema.products.localName,
        })
        .from(schema.productVariants)
        .innerJoin(
          schema.products,
          eq(schema.products.id, schema.productVariants.productId),
        )
        .innerJoin(
          schema.productName,
          eq(schema.productName.id, schema.products.productNameId),
        )
        .where(eq(schema.productVariants.id, id));

      if (!map.has(id)) {
        map.set(id, { ...varient });
      }
    }

    const requiredItems = items.map((i) => {
      const info = map.get(i.productVariantId as string) as {
        price: number;
        productName: string;
        localName: string;
      };
      return {
        ...i,
        ...info,
      };
    });

    const { id, createdAt, isPayment, type, userId, displayOrderStatus } =
      order;

    const res = {
      id,
      createdAt,
      isPayment,
      type,
      userId,
      displayOrderStatus,
      items: [...requiredItems],
    };
    return res;
  }

  async findAllForAdmin() {
    return this.db.query.orders.findMany({
      where: and(eq(schema.orders.type, 'display')),
    });
  }

  async findOneForAdmin(orderId: string) {
    const order = await this.db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
    });
    if (!order || order.type !== 'display')
      throw new NotFoundException('Display order not found');
    const items = await this.db.query.orderItems.findMany({
      where: eq(schema.orderItems.orderId, orderId),
    });
    return { ...order, items };
  }
  private async getOrThrow(orderId: string, vendorId: string) {
    const order = await this.db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.vendorId !== vendorId)
      throw new ForbiddenException('You do not own this order');
    return order;
  }
}
