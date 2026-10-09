// admin-product-listing/admin-product-listings.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DB_PROVIDER } from '../db/db.provider';
import * as schema from '../db/schema';
import {
  productListing,
  productListingVariants,
  productName,
  vendors,
  category,
  packagingType,
  measurementType,
} from '../db/schema';
import { NotificationService } from '../notification/notification.service';
import { ProductListingListQueryDto } from './dto/product-listing-list-query.dto';
import {
  formatMulti,
  formatProductLabel,
  formatSize,
} from '../comman/utils/product-format.utils';

// isRejectedByAdmin is nullable in the schema, so `= false` would silently drop NULL rows
const NOT_REJECTED = sql`COALESCE(${productListing.isRejectedByAdmin}, 0) = 0`;

@Injectable()
export class AdminProductListingsService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly notificationsService: NotificationService,
  ) {}

  async list(query: ProductListingListQueryDto) {
    const conditions = [NOT_REJECTED];

    if (query.status === 'approved')
      conditions.push(eq(productListing.isAcceptedByAdmin, true));
    if (query.status === 'unapproved')
      conditions.push(eq(productListing.isAcceptedByAdmin, false));
    if (query.type && query.type !== 'all')
      conditions.push(eq(productListing.type, query.type));

    const search = query.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          sql`CAST(${productListing.id} AS TEXT) LIKE ${pattern}`,
          like(vendors.farmName, pattern),
          like(productName.name, pattern),
        )!,
      );
    }

    const where = and(...conditions);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const dir = query.sort === 'old_to_new' ? asc : desc;

    const [{ total }] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(productListing)
      .innerJoin(vendors, eq(productListing.vendorId, vendors.id))
      .innerJoin(productName, eq(productListing.productId, productName.id))
      .where(where);

    const base = this.db
      .select({
        id: productListing.id,
        farmName: vendors.farmName,
        canonicalName: productName.name,
        localName: productListing.localName,
        type: productListing.type,
        isAcceptedByAdmin: productListing.isAcceptedByAdmin,
        createdAt: productListing.createdAt,
      })
      .from(productListing)
      .innerJoin(vendors, eq(productListing.vendorId, vendors.id))
      .innerJoin(productName, eq(productListing.productId, productName.id))
      .where(where)
      .orderBy(dir(productListing.createdAt), dir(productListing.id))
      .$dynamic();

    // The UI hides pagination while searching, so a search returns every match
    const rows = search
      ? await base
      : await base.limit(pageSize).offset((page - 1) * pageSize);

    if (rows.length === 0) return { data: [], total, page, pageSize };

    const variantRows = await this.db
      .select({
        listingId: productListingVariants.productListingId,
        size: productListingVariants.size,
        unit: measurementType.name,
        quantity: productListingVariants.quantity,
        pricePerUnit: productListingVariants.pricePerUnit,
      })
      .from(productListingVariants)
      .innerJoin(
        measurementType,
        eq(productListingVariants.measurementId, measurementType.id),
      )
      .where(
        inArray(
          productListingVariants.productListingId,
          rows.map((r) => r.id),
        ),
      )
      .orderBy(asc(productListingVariants.id));

    const byListing = new Map<number, typeof variantRows>();
    for (const v of variantRows) {
      byListing.set(v.listingId, [...(byListing.get(v.listingId) ?? []), v]);
    }

    return {
      data: rows.map((r) => {
        const vs = byListing.get(r.id) ?? [];
        return {
          productId: String(r.id),
          farmName: r.farmName,
          productName: formatProductLabel(
            r.canonicalName,
            vs.map((v) => formatSize(v.size, v.unit)),
          ),
          localName: r.localName ?? r.canonicalName,
          type: r.type,
          quantity: formatMulti(vs.map((v) => v.quantity)),
          unitPrice: formatMulti(vs.map((v) => v.pricePerUnit)),
          status: r.isAcceptedByAdmin ? 'approved' : 'unapproved',
          createdAt: r.createdAt,
        };
      }),
      total,
      page: search ? 1 : page,
      pageSize: search ? rows.length : pageSize,
    };
  }

  async getDetail(id: number) {
    const [row] = await this.db
      .select({
        id: productListing.id,
        vendorId: productListing.vendorId,
        farmName: vendors.farmName,
        localName: productListing.localName,
        canonicalName: productName.name,
        categoryName: category.categoryName,
        packagingName: packagingType.name,
        originCountry: productListing.originCountry,
        description: productListing.description,
        keywords: productListing.keywords,
        type: productListing.type,
        isAcceptedByAdmin: productListing.isAcceptedByAdmin,
        images: productListing.images,
        createdAt: productListing.createdAt,
      })
      .from(productListing)
      .innerJoin(vendors, eq(productListing.vendorId, vendors.id))
      .innerJoin(productName, eq(productListing.productId, productName.id))
      .innerJoin(category, eq(productListing.categoryId, category.id))
      .innerJoin(
        packagingType,
        eq(productListing.packagingTypeId, packagingType.id),
      )
      .where(and(eq(productListing.id, id), NOT_REJECTED))
      .limit(1);

    if (!row) throw new NotFoundException('Product listing not found');

    const variants = await this.db
      .select({
        variantId: productListingVariants.id,
        size: productListingVariants.size,
        measurementUnit: measurementType.name,
        quantity: productListingVariants.quantity,
        pricePerUnit: productListingVariants.pricePerUnit,
        sellingPrice: productListingVariants.sellingPrice,
      })
      .from(productListingVariants)
      .innerJoin(
        measurementType,
        eq(productListingVariants.measurementId, measurementType.id),
      )
      .where(eq(productListingVariants.productListingId, id))
      .orderBy(asc(productListingVariants.id));

    return {
      productId: String(row.id),
      vendorId: row.vendorId,
      farmName: row.farmName,
      localName: row.localName ?? row.canonicalName,
      category: row.categoryName,
      packagingType: row.packagingName,
      originCountry: row.originCountry,
      description: row.description ?? '',
      keywords: row.keywords ?? '',
      type: row.type,
      status: row.isAcceptedByAdmin ? 'approved' : 'unapproved',
      images: (row.images ?? []).map((img) => img.url),
      variants,
      createdAt: row.createdAt,
    };
  }

  async notifyVendorToUpdateStock(id: number) {
    const [listing] = await this.db
      .select({
        id: productListing.id,
        vendorId: productListing.vendorId,
        type: productListing.type,
        isAcceptedByAdmin: productListing.isAcceptedByAdmin,
        localName: productListing.localName,
        canonicalName: productName.name,
      })
      .from(productListing)
      .innerJoin(productName, eq(productListing.productId, productName.id))
      .where(and(eq(productListing.id, id), NOT_REJECTED))
      .limit(1);

    if (!listing) throw new NotFoundException('Product listing not found');
    if (listing.type !== 'display') {
      throw new BadRequestException(
        'Stock update requests only apply to display products',
      );
    }
    if (!listing.isAcceptedByAdmin) {
      throw new BadRequestException(
        'Approve the listing before notifying the vendor',
      );
    }

    await this.notificationsService.create({
      type: 'vendor',
      subType: 'stock_update_requested',
      vendorId: listing.vendorId,
      referenceId: String(listing.id),
      referenceType: 'product_listing',
      message: `Please update the stock for "${listing.localName ?? listing.canonicalName}"`,
    });

    return { message: 'Vendor notified' };
  }
}
