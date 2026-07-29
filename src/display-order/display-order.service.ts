import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { and, eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { CreateDisplayOrderDto } from './dto/create-display-order.dto';
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
    const [variant] = await this.db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants, dto.productVariantId));

    if (!variant) throw new NotFoundException('Product variant not found');

    const product = await this.db.query.products.findFirst({
      where: eq(schema.products.id, variant.productId),
    });

    if (!product || product.type !== 'display' || !product.vendorId) {
      throw new BadRequestException(
        'This product is not available for direct vendor ordering',
      );
    }

    if (variant.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
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
          vendorId: product.vendorId,
          displayOrderStatus: 'pending',
          vendorConfirmationDeadline: deadline,
          isOrdered: true,
        })
        .returning();

      await tx.insert(schema.orderItems).values({
        orderId: newOrder.id,
        productId: product.id,
        productVariantId: Number(variant.id),
        vendorId: product.vendorId,
        weightValue: variant.weightValue,
        weightUnit: variant.weightUnit as 'g' | 'kg' | 'l' | 'ml',
        quantity: dto.quantity,
        slug: product.slug,
      });

      await tx
        .update(schema.productVariants)
        .set({
          stock: variant.stock - dto.quantity,
          reservedStock: dto.quantity,
        })
        .where(eq(schema.productVariants.id, variant.id));

      await this.notificationsService.create({
        type: 'vendor',
        subType: 'display_order_request',
        vendorId: String(product.vendorId),
        referenceId: String(newOrder.id),
        referenceType: 'order',
        message: 'You have a new order — please respond within 1 hour',
      });

      return { orderId: newOrder.id };
    });

    await this.timeoutQueue.add(
      'display-order-timeout',
      { orderId: order.orderId },
      { delay: ORDER_WINDOW.orderResponseTime },
    );

    return order;
  }

  async findAllForVendor(vendorId: string) {
    return this.db.query.orders.findMany({
      where: eq(schema.orders.vendorId, vendorId),
    });
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
      .set({ displayOrderStatus: newStatus })
      .where(eq(schema.orders.id, order.id))
      .returning();

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
        .returning();

      return updated;
    });
  }

  async findOneForVendor(orderId: string, vendorId: string) {
    const order = await this.getOrThrow(orderId, vendorId);
    const items = await this.db.query.orderItems.findMany({
      where: eq(schema.orderItems.orderId, orderId),
    });
    return { ...order, items };
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
