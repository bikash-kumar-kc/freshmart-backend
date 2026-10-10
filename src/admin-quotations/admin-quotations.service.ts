// admin-quotations/admin-quotations.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DB_PROVIDER } from '../db/db.provider';
import * as schema from '../db/schema';
import {
  quotations,
  quotationVariants,
  productListing,
  productListingVariants,
  productName,
  measurementType,
  vendors,
  users,
  notificationsVendorAdmin,
} from '../db/schema';
import { QuotationListQueryDto } from './dto/quotation-list-query.dto';
import { CreateQuotationsDto } from './dto/create-quotations.dto';
import {
  APPROVED_BUCKET,
  UNAPPROVED_BUCKET,
  OPEN_STATUSES,
  quotationStatusSql,
} from './quotation-status.utils';
import {
  formatMulti,
  formatProductLabel,
  formatSize,
} from '../comman/utils/product-format.utils';

const NOT_REJECTED = sql`COALESCE(${productListing.isRejectedByAdmin}, 0) = 0`;
const NOW = sql`(current_timestamp)`;

type VendorNotificationSubType =
  'admin_filed_quotation' | 'quotation_cancelled';

// Inserted inside the same transaction as the change, so a rollback can't leave a stray notification
function vendorNotification(
  vendorId: string,
  quotationId: number,
  subType: VendorNotificationSubType,
  message: string,
) {
  return {
    type: 'vendor' as const,
    subType,
    vendorId,
    referenceId: String(quotationId),
    referenceType: 'quotation',
    message,
  };
}

@Injectable()
export class AdminQuotationsService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async list(query: QuotationListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const inBucket =
      query.bucket === 'unapproved' ? UNAPPROVED_BUCKET : APPROVED_BUCKET;
    const statuses =
      query.subStatus && query.subStatus !== 'all'
        ? inBucket.filter((s) => s === query.subStatus)
        : inBucket;

    // e.g. bucket=approved with subStatus=pending: valid request, nothing to return
    if (statuses.length === 0) return { data: [], total: 0, page, pageSize };

    const conditions = [inArray(quotationStatusSql, statuses)];
    const search = query.search?.trim();
    if (search)
      conditions.push(
        sql`CAST(${quotations.id} AS TEXT) LIKE ${`%${search}%`}`,
      );
    const where = and(...conditions);

    const [{ total }] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(quotations)
      .where(where);

    const rows = await this.db
      .select({
        id: quotations.id,
        farmName: vendors.farmName,
        canonicalName: productName.name,
        status: quotationStatusSql,
        createdByName: users.name,
        createdByEmail: users.email,
        createdAt: quotations.createdAt,
      })
      .from(quotations)
      .innerJoin(vendors, eq(quotations.vendorId, vendors.id))
      .innerJoin(
        productListing,
        eq(quotations.productListingId, productListing.id),
      )
      .innerJoin(productName, eq(productListing.productId, productName.id))
      .innerJoin(users, eq(quotations.adminId, users.id))
      .where(where)
      .orderBy(desc(quotations.createdAt), desc(quotations.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    if (rows.length === 0) return { data: [], total, page, pageSize };

    const variantRows = await this.db
      .select({
        quotationId: quotationVariants.quotationId,
        size: productListingVariants.size,
        unit: measurementType.name,
        quantity: quotationVariants.quantity,
      })
      .from(quotationVariants)
      .innerJoin(
        productListingVariants,
        eq(
          quotationVariants.productListingVariantId,
          productListingVariants.id,
        ),
      )
      .innerJoin(
        measurementType,
        eq(productListingVariants.measurementId, measurementType.id),
      )
      .where(
        inArray(
          quotationVariants.quotationId,
          rows.map((r) => r.id),
        ),
      )
      .orderBy(asc(quotationVariants.id));

    const byQuotation = new Map<number, typeof variantRows>();
    for (const v of variantRows) {
      byQuotation.set(v.quotationId, [
        ...(byQuotation.get(v.quotationId) ?? []),
        v,
      ]);
    }

    return {
      data: rows.map((r) => {
        const vs = byQuotation.get(r.id) ?? [];
        return {
          quotationId: String(r.id),
          farmName: r.farmName,
          productName: formatProductLabel(
            r.canonicalName,
            vs.map((v) => formatSize(v.size, v.unit)),
          ),
          requestedQuantity: formatMulti(vs.map((v) => v.quantity)),
          status: r.status,
          createdBy: r.createdByName ?? r.createdByEmail,
          createdAt: r.createdAt,
        };
      }),
      total,
      page,
      pageSize,
    };
  }

  async getDetail(id: number) {
    const [row] = await this.db
      .select({
        id: quotations.id,
        vendorId: quotations.vendorId,
        farmName: vendors.farmName,
        listingId: quotations.productListingId,
        canonicalName: productName.name,
        status: quotationStatusSql,
        createdAt: quotations.createdAt,
      })
      .from(quotations)
      .innerJoin(vendors, eq(quotations.vendorId, vendors.id))
      .innerJoin(
        productListing,
        eq(quotations.productListingId, productListing.id),
      )
      .innerJoin(productName, eq(productListing.productId, productName.id))
      .where(and(eq(quotations.id, id), sql`${quotationStatusSql} <> 'draft'`))
      .limit(1);

    if (!row) throw new NotFoundException('Quotation not found');

    const variants = await this.db
      .select({
        variantId: quotationVariants.productListingVariantId,
        size: productListingVariants.size,
        unit: measurementType.name,
        quantity: quotationVariants.quantity,
        actualPrice: quotationVariants.originalPricePerUnit,
        requestedPrice: quotationVariants.adminSuggestedPricePerUnit,
        counterPrice: quotationVariants.vendorCounterPricePerUnit,
      })
      .from(quotationVariants)
      .innerJoin(
        productListingVariants,
        eq(
          quotationVariants.productListingVariantId,
          productListingVariants.id,
        ),
      )
      .innerJoin(
        measurementType,
        eq(productListingVariants.measurementId, measurementType.id),
      )
      .where(eq(quotationVariants.quotationId, id))
      .orderBy(asc(quotationVariants.id));

    return {
      quotationId: String(row.id),
      vendorId: row.vendorId,
      farmName: row.farmName,
      productListingId: String(row.listingId),
      productName: row.canonicalName,
      status: row.status,
      variants: variants.map((v) => ({
        variantId: String(v.variantId),
        size: formatSize(v.size, v.unit),
        quantity: v.quantity,
        actualPrice: v.actualPrice,
        requestedPrice: v.requestedPrice,
        counterPrice: v.counterPrice,
      })),
      createdAt: row.createdAt,
    };
  }

  // ── Create-quotation page options ──────────────────────────────────

  async getApprovedVendors() {
    const rows = await this.db
      .select({ vendorId: vendors.id, farmName: vendors.farmName })
      .from(vendors)
      .where(
        and(eq(vendors.isVendorApproved, true), ne(vendors.isDeleted, true)),
      )
      .orderBy(asc(vendors.farmName));

    return rows.map((r) => ({ ...r, status: 'approved' as const }));
  }

  async getEligibleProducts(vendorId: string) {
    const listings = await this.db
      .select({ id: productListing.id, name: productName.name })
      .from(productListing)
      .innerJoin(productName, eq(productListing.productId, productName.id))
      .where(
        and(
          eq(productListing.vendorId, vendorId),
          eq(productListing.isAcceptedByAdmin, true),
          eq(productListing.type, 'inventory'),
          NOT_REJECTED,
        ),
      )
      .orderBy(asc(productListing.id));

    if (listings.length === 0) return [];

    const variantRows = await this.db
      .select({
        id: productListingVariants.id,
        listingId: productListingVariants.productListingId,
        size: productListingVariants.size,
        unit: measurementType.name,
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
          listings.map((l) => l.id),
        ),
      )
      .orderBy(asc(productListingVariants.id));

    const byListing = new Map<number, typeof variantRows>();
    for (const v of variantRows) {
      byListing.set(v.listingId, [...(byListing.get(v.listingId) ?? []), v]);
    }

    return listings.map((l) => ({
      vendorId,
      productListingId: String(l.id),
      productName: l.name,
      status: 'approved' as const,
      type: 'inventory' as const,
      variants: (byListing.get(l.id) ?? []).map((v) => ({
        variantId: String(v.id),
        size: formatSize(v.size, v.unit),
        actualPrice: v.pricePerUnit,
      })),
    }));
  }

  // ── Mutations ──────────────────────────────────────────────────────

  async create(adminUserId: string, dto: CreateQuotationsDto) {
    const vendor = await this.db.query.vendors.findFirst({
      where: and(
        eq(vendors.id, dto.vendorId!),
        eq(vendors.isVendorApproved, true),
        ne(vendors.isDeleted, true),
      ),
      columns: { id: true },
    });
    if (!vendor)
      throw new BadRequestException('Vendor not found or not approved');

    const listingIds = dto.quotations!.map((q) => q.productListingId);
    if (new Set(listingIds).size !== listingIds.length) {
      throw new BadRequestException(
        'Each product can only appear once per request',
      );
    }
    const variantIds = dto.quotations!.flatMap((q) =>
      q.variants!.map((v) => v.variantId),
    );
    if (new Set(variantIds).size !== variantIds.length) {
      throw new BadRequestException('A variant cannot be listed twice');
    }

    const validListingIds = listingIds.filter(
      (id): id is number => id !== undefined,
    );

    const listings = await this.db
      .select({
        id: productListing.id,
        name: productName.name,
      })
      .from(productListing)
      .innerJoin(productName, eq(productListing.productId, productName.id))
      .where(
        and(
          inArray(productListing.id, validListingIds),
          eq(productListing.vendorId, dto.vendorId!),
          eq(productListing.isAcceptedByAdmin, true),
          eq(productListing.type, 'inventory'),
          NOT_REJECTED,
        ),
      );
    if (listings.length !== listingIds.length) {
      throw new BadRequestException(
        'One or more products are not available for quotation from this vendor',
      );
    }
    const nameById = new Map(listings.map((l) => [l.id, l.name]));

    const validVariantIds = variantIds.filter(
      (id): id is number => id !== undefined,
    );

    const variantRows = await this.db
      .select({
        id: productListingVariants.id,
        listingId: productListingVariants.productListingId,
        pricePerUnit: productListingVariants.pricePerUnit,
      })
      .from(productListingVariants)
      .where(inArray(productListingVariants.id, validVariantIds));
    const variantById = new Map(variantRows.map((v) => [v.id, v]));

    for (const q of dto.quotations!) {
      for (const v of q.variants!) {
        const row = variantById.get(v.variantId!);
        if (!row || row.listingId !== q.productListingId) {
          throw new BadRequestException(
            `Variant ${v.variantId} does not belong to "${nameById.get(q.productListingId!)}"`,
          );
        }
        if (v.adminSuggested! > row.pricePerUnit) {
          throw new BadRequestException(
            `Requested price for "${nameById.get(q.productListingId)}" cannot exceed the actual price (${row.pricePerUnit})`,
          );
        }
      }
    }

    // Stops a double-submit, or a second quotation, while one is still being negotiated

    const open = await this.db
      .select({
        listingId: quotations.productListingId,
      })
      .from(quotations)
      .where(
        and(
          inArray(quotations.productListingId, validListingIds),
          inArray(quotationStatusSql, OPEN_STATUSES),
        ),
      );
    if (open.length > 0) {
      const names = [
        ...new Set(open.map((o) => nameById.get(o.listingId))),
      ].join(', ');
      throw new ConflictException(
        `An open quotation already exists for: ${names}`,
      );
    }

    const ids = await this.db.transaction(async (tx) => {
      const createdIds: number[] = [];

      for (const q of dto.quotations!) {
        if (q.productListingId === undefined) {
          throw new Error('Product listing ID is required');
        }

        const [created] = await tx
          .insert(quotations)
          .values({
            vendorId: dto.vendorId!,
            adminId: adminUserId,
            productListingId: q.productListingId,
            isApprovedByAdmin: true,
          })
          .returning({ id: quotations.id });

        await tx.insert(quotationVariants).values(
          q.variants!.map((v) => {
            if (
              v.quantity === undefined ||
              v.variantId === undefined ||
              v.adminSuggested === undefined
            ) {
              throw new Error('Required quotation item fields are missing');
            }

            return {
              quotationId: created.id,
              productListingVariantId: v.variantId,
              originalPricePerUnit: variantById.get(v.variantId)!.pricePerUnit,
              adminSuggestedPricePerUnit: v.adminSuggested,
              quantity: v.quantity,
            };
          }),
        );

        await tx
          .insert(notificationsVendorAdmin)
          .values(
            vendorNotification(
              dto.vendorId!,
              created.id,
              'admin_filed_quotation',
              `You have a new quotation for "${nameById.get(q.productListingId)}"`,
            ),
          );

        createdIds.push(created.id);
      }

      return createdIds;
    });

    return {
      message: 'Quotations sent to the vendor',
      quotationIds: ids.map(String),
    };
  }

  async approve(id: number) {
    return this.db.transaction(async (tx) => {
      const [q] = await tx
        .select({ vendorId: quotations.vendorId, status: quotationStatusSql })
        .from(quotations)
        .where(eq(quotations.id, id));

      if (!q) throw new NotFoundException('Quotation not found');
      if (q.status !== 'rechecking' && q.status !== 'countered') {
        throw new BadRequestException(
          `Only rechecking or countered quotations can be approved (current: ${q.status})`,
        );
      }

      // Conditioning the update on the flags we just read: two admins clicking at once can't both win
      const [updated] = await tx
        .update(quotations)
        .set({
          isReapprovedByAdmin: true,
          isApprovedByAdmin: true,
          updatedAt: NOW,
        })
        .where(
          and(
            eq(quotations.id, id),
            eq(quotations.isReapprovedByAdmin, false),
            eq(quotations.isCancelledByAdmin, false),
            eq(quotations.isDelivered, false),
          ),
        )
        .returning({ id: quotations.id });

      if (!updated)
        throw new ConflictException('Quotation just changed, please refresh');

      await tx
        .insert(notificationsVendorAdmin)
        .values(
          vendorNotification(
            q.vendorId,
            id,
            'admin_filed_quotation',
            `Quotation #${id} was approved by FreshMart`,
          ),
        );

      return { quotationId: String(id), status: 'approved' as const };
    });
  }

  async cancel(id: number) {
    return this.db.transaction(async (tx) => {
      const [q] = await tx
        .select({ vendorId: quotations.vendorId, status: quotationStatusSql })
        .from(quotations)
        .where(eq(quotations.id, id));

      if (!q) throw new NotFoundException('Quotation not found');
      if (!['pending', 'rechecking', 'countered'].includes(q.status)) {
        throw new BadRequestException(
          `A ${q.status} quotation cannot be cancelled`,
        );
      }

      const [updated] = await tx
        .update(quotations)
        .set({ isCancelledByAdmin: true, updatedAt: NOW })
        .where(
          and(
            eq(quotations.id, id),
            eq(quotations.isCancelledByAdmin, false),
            eq(quotations.isReapprovedByAdmin, false),
            eq(quotations.isDelivered, false),
          ),
        )
        .returning({ id: quotations.id });

      if (!updated)
        throw new ConflictException('Quotation just changed, please refresh');

      await tx
        .insert(notificationsVendorAdmin)
        .values(
          vendorNotification(
            q.vendorId,
            id,
            'quotation_cancelled',
            `Quotation #${id} was cancelled by FreshMart`,
          ),
        );

      return { quotationId: String(id), status: 'cancelled' as const };
    });
  }
}
