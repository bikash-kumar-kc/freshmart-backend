import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DB_PROVIDER } from '../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { and, eq, gte, inArray, SQL, sql } from 'drizzle-orm';
import { IListVendorsQueryDto } from './dto/list-vendors-query..dto';
import { IAdminUpdateVendorDto } from './dto/admin-update-vendor.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ProductStockStatus,
  TopProductsPeriod,
  TopProductsQueryDto,
} from './dashboard/dto/top-product-query.dto';
import { products, productVariants, orderItems, orders } from '../db/schema';
import { LOW_STOCK_THRESHOLD } from './constants/lowStockThreshold';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
    @InjectQueue('otp-email') private readonly otpQueue: Queue,
  ) {}

  // admin approves the vendor...
  async approveVendor(id: string) {
    const vendor = await this.db.query.vendors.findFirst({
      where: eq(schema.vendors.id, id),
    });

    if (!vendor) throw new NotFoundException('Vendor not found');

    if (!vendor.isEmailVerified) {
      throw new BadRequestException(
        'Cannot approve a vendor whose email is not verified',
      );
    }

    if (vendor.isVendorApproved) {
      throw new BadRequestException('Vendor is already approved');
    }

    const [updated] = await this.db
      .update(schema.vendors)
      .set({ isVendorApproved: true, updatedAt: sql`(current_timestamp)` })
      .where(eq(schema.vendors.id, id))
      .returning({
        id: schema.vendors.id,
        isVendorApproved: schema.vendors.isVendorApproved,
      });

    await this.otpQueue.add('vendor-registration-approved', {
      email: vendor.email,
      vendorId: vendor.id,
      type: 'vendor-verification-message',
    });

    return updated;
  }

  // admin gets the list of vendors...
  listVendors(query: IListVendorsQueryDto) {
    const conditions: SQL[] = [];

    if (query.emailVerified !== undefined) {
      conditions.push(
        eq(schema.vendors.isEmailVerified, query.emailVerified === 'true'),
      );
    }

    if (query.approved !== undefined) {
      conditions.push(
        eq(schema.vendors.isVendorApproved, query.approved === 'true'),
      );
    }

    this.db.query.vendors.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      columns: {
        id: true,
        farmName: true,
        email: true,
        isEmailVerified: true,
        isVendorApproved: true,
      },
    });
  }

  // admin updates the vendor registration...
  async adminUpdateVendor(id: string, dto: IAdminUpdateVendorDto) {
    const vendor = await this.db.query.vendors.findFirst({
      where: eq(schema.vendors.id, id),
    });

    if (!vendor) throw new NotFoundException('Vendor not found');

    const [updated] = await this.db
      .update(schema.vendors)
      .set({ ...dto, updatedAt: sql`(current_timestamp)` })
      .where(eq(schema.vendors.id, id))
      .returning({
        id: schema.vendors.id,
        updatedAt: schema.vendors.updatedAt,
      });

    return updated;
  }

  // vendor approved or unapproved product listing...
  async findAllForAdmin(isVerified?: boolean) {
    return this.db.query.productListing.findMany({
      where:
        isVerified !== undefined
          ? eq(schema.productListing.isAcceptedByAdmin, isVerified)
          : undefined,
      columns: {
        id: true,
        vendorId: true,
        type: true,
      },
    });
  }

  // approving the vendor product...
  async approveListing(id: number) {
    const listing = await this.db.query.productListing.findFirst({
      where: eq(schema.productListing.id, id),
    });

    if (!listing) {
      throw new NotFoundException('Product listing not found');
    }

    if (listing.isAcceptedByAdmin) {
      throw new BadRequestException('This listing is already approved');
    }

    const [updated] = await this.db
      .update(schema.productListing)
      .set({
        isAcceptedByAdmin: true,
        isRejectedByAdmin: false,
        updatedAt: sql`(current_timestamp)`,
      })
      .where(eq(schema.productListing.id, id))
      .returning({
        productListingId: schema.productListing.id,
        isAcceptedByAdmin: schema.productListing.isAcceptedByAdmin,
      });

    await this.db.insert(schema.notificationsVendorAdmin).values({
      type: 'vendor',
      subType: 'product_approved',
      referenceId: String(updated.productListingId),
      referenceType: 'productListing',
      message: 'Hey, admin approved your product. Take a look',
    });

    return updated;
  }

  // rejecting the vendor product...
  async rejectListing(id: number) {
    const listing = await this.db.query.productListing.findFirst({
      where: eq(schema.productListing.id, id),
    });

    if (!listing) {
      throw new NotFoundException('Product listing not found');
    }

    if (listing.isAcceptedByAdmin) {
      throw new BadRequestException(
        'An approved listing cannot be rejected directly — reconsider approval status first',
      );
    }

    if (listing.isRejectedByAdmin) {
      throw new BadRequestException('Product is already rejected by admin');
    }

    const [updated] = await this.db
      .update(schema.productListing)
      .set({
        isRejectedByAdmin: true,
        updatedAt: sql`(current_timestamp)`,
      })
      .where(eq(schema.productListing.id, id))
      .returning({
        productListingId: schema.productListing.id,
        isRejectedByAdmin: schema.productListing.isRejectedByAdmin,
      });
    return updated;
  }

  // top products...
  async getTopProducts(query: TopProductsQueryDto) {
    const periodDays = query.period === TopProductsPeriod.MONTH ? 30 : 7;
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    // Base popular set — no LIMIT here yet, since status filtering happens after computing stock
    const popularRows = await this.db
      .select({
        id: products.id,
        name: products.name,
        thumbnail: products.thumbnail,
        vendorId: products.vendorId,
        type: products.type,
        popularityScore: products.popularityScore,
      })
      .from(products)
      .where(eq(products.isMostPopular, true));

    if (popularRows.length === 0) return [];

    const productIds = popularRows.map((p) => p.id);

    // Stock: sum across all variants per product (not period-scoped — current stock, always live)
    const stockRows = await this.db
      .select({
        productId: productVariants.productId,
        totalStock: sql<number>`SUM(${productVariants.stock})`,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds))
      .groupBy(productVariants.productId);

    // Sales + earning: scoped to the selected period, joined through orders for createdAt,
    // and through productVariants for price (orderItems itself carries no price field)
    const salesRows = await this.db
      .select({
        productId: orderItems.productId,
        totalSales: sql<number>`SUM(${orderItems.quantity})`,
        totalEarning: sql<number>`SUM(${orderItems.quantity} * ${productVariants.price})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(
        productVariants,
        eq(orderItems.productVariantId, productVariants.id),
      )
      .where(
        and(
          inArray(orderItems.productId, productIds),
          gte(orders.createdAt, periodStart.toISOString()),
        ),
      )
      .groupBy(orderItems.productId);

    const stockMap = new Map(stockRows.map((r) => [r.productId, r.totalStock]));
    const salesMap = new Map(
      salesRows.map((r) => [
        r.productId,
        { sales: r.totalSales, earning: r.totalEarning },
      ]),
    );

    const computed = popularRows.map((p) => {
      const stock = stockMap.get(p.id) ?? 0;
      const salesData = salesMap.get(p.id) ?? { sales: 0, earning: 0 };
      const status =
        stock === 0
          ? 'out_of_stock'
          : stock < LOW_STOCK_THRESHOLD
            ? 'low_stock'
            : 'in_stock';

      return {
        id: p.id,
        productId: p.id,
        vendorId: p.vendorId,
        name: p.name,
        image: p.thumbnail,
        type: p.type,
        sales: salesData.sales,
        earning: salesData.earning,
        stock,
        status,
        popularityScore: p.popularityScore,
      };
    });

    const filtered = query.status
      ? computed.filter(
          (p) => (p.status as ProductStockStatus) === query.status,
        )
      : computed;

    return filtered
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 5)
      .map(({ popularityScore, ...rest }) => rest);
  }
}
