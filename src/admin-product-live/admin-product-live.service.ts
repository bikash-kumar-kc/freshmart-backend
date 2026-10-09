// admin-product-live/admin-product-live.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  like,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DB_PROVIDER } from '../db/db.provider';
import * as schema from '../db/schema';
import {
  products,
  productVariants,
  orders,
  orderItems,
  users,
} from '../db/schema';
import { ProductLiveListQueryDto } from './dto/product-live-list-query.dto';
import { UpdateProductLiveStatusDto } from './dto/update-product-live-status.dto';
import {
  formatProductLabel,
  formatSize,
} from '../comman/utils/product-format.utils';
import { NotificationService } from '../notification/notification.service';

// 1. imports: delete the two local STOCK_* maps and add
import {
  STOCK_STATUS_TO_API,
  STOCK_FILTER_TO_COLUMN,
} from '../comman/utils/stock-status.utils';

// Same notion of "a real sale" as the popularity job, plus display orders that weren't cancelled
const VALID_SALE_ORDER = or(
  and(
    eq(orders.type, 'inventory'),
    eq(orders.isOrdered, true),
    eq(orders.isPayment, true),
    eq(orders.isPaymentProcess, false),
    isNotNull(orders.orderStatus),
    ne(orders.orderStatus, 'failed'),
  ),
  and(
    eq(orders.type, 'display'),
    eq(orders.isOrdered, true),
    ne(orders.displayOrderStatus, 'cancelled'),
  ),
)!;

const INVENTORY_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  packaging: 'Packaging',
  ontheway: 'Shipped',
  delivered: 'Delivered',
  failed: 'Failed',
};
const DISPLAY_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const available = (v: { stock: number; reservedStock: number }) =>
  Math.max(0, v.stock - v.reservedStock);

@Injectable()
export class AdminProductLiveService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly notificationsService: NotificationService,
  ) {}

  async list(query: ProductLiveListQueryDto) {
    const conditions = [isNotNull(products.vendorId)]; // seeded products are out of scope

    if (query.stock && query.stock !== 'all' && query.live !== 'draft') {
      conditions.push(
        eq(products.stockStatus, STOCK_FILTER_TO_COLUMN[query.stock]),
      );
      conditions.push(eq(products.status, 'active'));
    }
    if (query.live === 'live') conditions.push(eq(products.status, 'active'));
    if (query.live === 'draft') conditions.push(eq(products.status, 'draft'));
    if (query.type && query.type !== 'all')
      conditions.push(eq(products.type, query.type));

    const search = query.search?.trim();
    if (search) conditions.push(like(products.id, `%${search}%`));

    const where = and(...conditions);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const [{ total }] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(products)
      .where(where);

    const base = this.db
      .select({
        id: products.id,
        name: products.name,
        thumbnail: products.thumbnail,
        type: products.type,
        status: products.status,
        stockStatus: products.stockStatus,
        isOffered: products.isOffered,
        offerEndDate: products.offerEndDate,
      })
      .from(products)
      .where(where)
      .orderBy(desc(products.createdAt), desc(products.id))
      .$dynamic();

    const rows = await base.limit(pageSize).offset((page - 1) * pageSize);

    if (rows.length === 0) return { data: [], total, page, pageSize };

    const ids = rows.map((r) => r.id);

    const [variantRows, salesRows] = await Promise.all([
      this.db
        .select({
          productId: productVariants.productId,
          weightValue: productVariants.weightValue,
          weightUnit: productVariants.weightUnit,
          stock: productVariants.stock,
          reservedStock: productVariants.reservedStock,
        })
        .from(productVariants)
        .where(inArray(productVariants.productId, ids))
        .orderBy(asc(productVariants.createdAt), asc(productVariants.id)),

      this.db
        .select({
          productId: orderItems.productId,
          totalSales: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
          totalOrders: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(inArray(orderItems.productId, ids), VALID_SALE_ORDER))
        .groupBy(orderItems.productId),
    ]);

    const variantsByProduct = new Map<string, typeof variantRows>();
    for (const v of variantRows) {
      variantsByProduct.set(v.productId, [
        ...(variantsByProduct.get(v.productId) ?? []),
        v,
      ]);
    }
    const salesByProduct = new Map(salesRows.map((s) => [s.productId, s]));

    return {
      data: rows.map((p) => {
        const vs = variantsByProduct.get(p.id) ?? [];
        const sales = salesByProduct.get(p.id);
        const isLive = p.status === 'active';

        return {
          productId: p.id,
          productName: formatProductLabel(
            p.name,
            vs.map((v) => formatSize(v.weightValue, v.weightUnit as string)),
          ),
          image: p.thumbnail,
          type: p.type,
          liveStatus: isLive ? 'live' : 'draft',
          stockStatus:
            isLive && p.stockStatus ? STOCK_STATUS_TO_API[p.stockStatus] : null,
          totalStock: vs.reduce((sum, v) => sum + available(v), 0),
          totalSales: Number(sales?.totalSales ?? 0),
          totalOrders: Number(sales?.totalOrders ?? 0),
          offerEndDate: p.isOffered ? p.offerEndDate : null,
        };
      }),
      total,
      page,
      pageSize,
    };
  }

  async getDetail(productId: string) {
    const product = await this.db.query.products.findFirst({
      where: and(eq(products.id, productId), isNotNull(products.vendorId)),
    });
    if (!product) throw new NotFoundException('Product not found');

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 29);
    since.setUTCHours(0, 0, 0, 0);

    const [variantRows, totalsRows, trendRows, recentRows] = await Promise.all([
      this.db
        .select({
          weightValue: productVariants.weightValue,
          weightUnit: productVariants.weightUnit,
          stock: productVariants.stock,
          reservedStock: productVariants.reservedStock,
        })
        .from(productVariants)
        .where(eq(productVariants.productId, productId))
        .orderBy(asc(productVariants.createdAt), asc(productVariants.id)),

      // Revenue uses the current variant price: orderItems keeps no price snapshot
      this.db
        .select({
          totalSales: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
          totalOrders: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
          totalRevenue: sql<number>`COALESCE(SUM(${orderItems.quantity} * ${productVariants.price}), 0)`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .leftJoin(
          productVariants,
          eq(orderItems.productVariantId, productVariants.id),
        )
        .where(and(eq(orderItems.productId, productId), VALID_SALE_ORDER)),

      this.db
        .select({
          day: sql<string>`substr(${orders.createdAt}, 1, 10)`,
          sales: sql<number>`SUM(${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orderItems.productId, productId),
            VALID_SALE_ORDER,
            gte(orders.createdAt, since.toISOString()),
          ),
        )
        .groupBy(sql`substr(${orders.createdAt}, 1, 10)`),

      this.db
        .select({
          orderId: orders.id,
          customerName: users.name,
          customerEmail: users.email,
          quantity: orderItems.quantity,
          orderType: orders.type,
          orderStatus: orders.orderStatus,
          displayOrderStatus: orders.displayOrderStatus,
          createdAt: orders.createdAt,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(users, eq(orders.userId, users.id))
        .where(
          and(eq(orderItems.productId, productId), eq(orders.isOrdered, true)),
        )
        .orderBy(desc(orders.createdAt))
        .limit(5),
    ]);

    const totals = totalsRows[0];
    const byDay = new Map(trendRows.map((r) => [r.day, Number(r.sales)]));
    const salesTrend = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      return {
        date: d.toISOString(),
        sales: byDay.get(d.toISOString().slice(0, 10)) ?? 0,
      };
    });

    const offerActive =
      product.isOffered &&
      !!product.offerEndDate &&
      new Date(product.offerEndDate).getTime() > Date.now();

    return {
      productId: product.id,
      productName: formatProductLabel(
        product.name,
        variantRows.map((v) =>
          formatSize(v.weightValue, v.weightUnit as string),
        ),
      ),
      image: product.thumbnail,
      type: product.type,
      liveStatus: product.status === 'active' ? 'live' : 'draft',
      offer: {
        isActive: offerActive,
        createdAt: product.offerStartDate,
        validUntil: product.offerEndDate,
      },
      totalSales: Number(totals.totalSales),
      totalRevenue: Number(totals.totalRevenue),
      totalOrders: Number(totals.totalOrders),
      currentStock: variantRows.reduce((sum, v) => sum + available(v), 0),
      salesTrend,
      recentOrders: recentRows.map((o) => ({
        orderId: o.orderId,
        customerName: o.customerName ?? o.customerEmail,
        quantity: o.quantity,
        status:
          o.orderType === 'inventory'
            ? (INVENTORY_STATUS_LABEL[o.orderStatus ?? ''] ?? '—')
            : (DISPLAY_STATUS_LABEL[o.displayOrderStatus ?? ''] ?? '—'),
        createdAt: o.createdAt,
      })),
    };
  }

  async updateStatus(productId: string, dto: UpdateProductLiveStatusDto) {
    const product = await this.db.query.products.findFirst({
      where: and(eq(products.id, productId), isNotNull(products.vendorId)),
      columns: { id: true, status: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const target = dto.status === 'live' ? 'active' : 'draft';
    if (product.status === target) {
      throw new BadRequestException(
        `Product is already ${dto.status === 'live' ? 'live' : 'a draft'}`,
      );
    }

    // Conditioning on the status we just read means two admins toggling at once can't both win
    const [updated] = await this.db
      .update(products)
      .set({
        status: target,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(
        and(eq(products.id, productId), eq(products.status, product.status)),
      )
      .returning({ id: products.id, status: products.status });

    if (!updated)
      throw new ConflictException(
        'Product status just changed, please refresh',
      );

    // TODO(#6): tell the Next.js app to revalidate this product's cached pages

    return {
      productId: updated.id,
      liveStatus: updated.status === 'active' ? 'live' : 'draft',
    };
  }

  async notifyVendorToUpdateStock(productId: string) {
    const product = await this.db.query.products.findFirst({
      where: and(eq(products.id, productId), isNotNull(products.vendorId)),
      columns: {
        id: true,
        name: true,
        type: true,
        status: true,
        vendorId: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.type !== 'display') {
      throw new BadRequestException(
        'Stock update requests only apply to display products',
      );
    }
    if (product.status !== 'active') {
      throw new BadRequestException(
        'Publish the product before notifying the vendor',
      );
    }

    await this.notificationsService.create({
      type: 'vendor',
      subType: 'stock_update_requested',
      vendorId: product.vendorId!,
      referenceId: product.id,
      referenceType: 'product',
      message: `Please update the stock for "${product.name}"`,
    });

    return { message: 'Vendor notified' };
  }
}
