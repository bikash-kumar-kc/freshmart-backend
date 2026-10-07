// admin-vendors/admin-vendors.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, or, like, ne, sql, SQL, desc } from 'drizzle-orm';
import { DB_PROVIDER } from '../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { vendors, products } from '../db/schema';
import { VendorListQueryDto } from './dto/vendor-list-query.dto';
import { deriveVendorStatus } from './utils/vendor-status';
import { REDIS_PROVIDER } from '../redis/redis.provider';
import Redis from 'ioredis';

const POPULAR_PRODUCTS_CACHE_TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class AdminVendorsService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
    @Inject(REDIS_PROVIDER) private readonly redis: Redis,
  ) {}

  async list(query: VendorListQueryDto) {
    const conditions: SQL[] = [];

    if (query.status === 'all') {
      conditions.push(ne(vendors.isDeleted, true));
    } else if (query.status === 'approved') {
      conditions.push(
        eq(vendors.isVendorApproved, true),
        ne(vendors.isDeleted, true),
      );
    } else if (query.status === 'unapproved') {
      conditions.push(
        eq(vendors.isVendorApproved, false),
        ne(vendors.isDeleted, true),
      );
    } else if (query.status === 'deleted') {
      conditions.push(eq(vendors.isDeleted, true));
    }

    if (query.search?.trim()) {
      const s = `%${query.search.trim()}%`;

      const searchCondition = or(
        like(vendors.id, s),
        like(vendors.farmName, s),
      );

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const whereClause = and(...conditions);

    const [{ count: total }] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(vendors)
      .where(whereClause);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const rows = await this.db
      .select()
      .from(vendors)
      .where(whereClause)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      data: rows.map((v) => ({
        farmId: v.id,
        farmName: v.farmName,
        location: v.addressLocation,
        email: v.email,
        phone: v.phoneNumber,
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        status: deriveVendorStatus(v),
        createdAt: v.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  // admin-vendors/admin-vendors.service.ts (updated getDetail)
  async getDetail(farmId: string) {
    const vendor = await this.db.query.vendors.findFirst({
      where: eq(vendors.id, farmId),
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const status = deriveVendorStatus(vendor);

    return {
      vendor: {
        farmId: vendor.id,
        vendorImage: null,
        farmOwner: vendor.farmOwner,
        status,
        email: vendor.email,
        phone: vendor.phoneNumber,
        farmName: vendor.farmName,
        farmOriginCountry: vendor.farmOriginCountry,
        farmAddress: vendor.addressLocation,
        farmDescription: vendor.farmDescription,
        panVatCertificateUrl: vendor.panVatCertificateUrl,
        organicCertificates: vendor.certificates ?? [],
        createdAt: vendor.createdAt,
      },
      // Only computed/returned when approved — matches the frontend's existing
      // `{vendor.status === "approved" && <VendorPopularProducts .../>}` gate
      popularProducts:
        status === 'approved' ? await this.getPopularProducts(farmId) : [],
    };
  }

  async approve(farmId: string) {
    const vendor = await this.getVendorOrThrow(farmId);
    if (!vendor.isEmailVerified) {
      throw new BadRequestException(
        'Cannot approve a vendor whose email is not verified',
      );
    }
    if (vendor.isVendorApproved) {
      throw new BadRequestException('Vendor is already approved');
    }

    const [updated] = await this.db
      .update(vendors)
      .set({ isVendorApproved: true, updatedAt: sql`(current_timestamp)` })
      .where(eq(vendors.id, farmId))
      .returning();

    return updated;
  }

  async unapprove(farmId: string) {
    const vendor = await this.getVendorOrThrow(farmId);
    if (!vendor.isVendorApproved) {
      throw new BadRequestException('Vendor is not currently approved');
    }

    const [updated] = await this.db
      .update(vendors)
      .set({ isVendorApproved: false, updatedAt: sql`(current_timestamp)` })
      .where(eq(vendors.id, farmId))
      .returning();

    return updated;
  }

  async softDelete(farmId: string) {
    await this.getVendorOrThrow(farmId);

    const [updated] = await this.db
      .update(vendors)
      .set({ isDeleted: true, updatedAt: sql`(current_timestamp)` })
      .where(eq(vendors.id, farmId))
      .returning();

    return updated;
  }

  private async getVendorOrThrow(farmId: string) {
    const vendor = await this.db.query.vendors.findFirst({
      where: eq(vendors.id, farmId),
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async getPopularProducts(vendorId: string) {
    const cacheKey = `vendor:popular-products:${vendorId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const popularProducts = await this.db
      .select({
        id: products.id,
        productId: products.id,
        name: products.name,
        image: products.thumbnail,
        type: products.type,
        popularityScore: products.popularityScore,
      })
      .from(products)
      .where(eq(products.vendorId, vendorId))
      .orderBy(desc(products.popularityScore))
      .limit(5);

    await this.redis.set(
      cacheKey,
      JSON.stringify(popularProducts),
      'EX',
      POPULAR_PRODUCTS_CACHE_TTL_SECONDS,
    );

    return popularProducts;
  }
}
