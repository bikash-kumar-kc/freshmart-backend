import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { DB_PROVIDER } from '../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { NotificationService } from '../notification/notification.service';
import { and, eq, sql } from 'drizzle-orm';
import { IVendorCounterQuotationDto } from './dto/vendor-counter-quotation.dto';

@Injectable()
export class QuotationService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly notificationsService: NotificationService,
  ) {}

  async create(adminId: string, dto: CreateQuotationDto) {
    const listing = await this.db.query.productListing.findFirst({
      where: eq(schema.productListing.id, dto.productListingId),
    });

    if (!listing) throw new NotFoundException('Product listing not found');

    if (!listing.isAcceptedByAdmin) {
      throw new BadRequestException(
        'Cannot generate a quotation for a listing that is not yet approved',
      );
    }

    return this.db.transaction(async (tx) => {
      const [quotation] = await tx
        .insert(schema.quotations)
        .values({
          vendorId: listing.vendorId,
          adminId,
          productListingId: listing.id,
          isApprovedByAdmin: false,
        })
        .returning({ id: schema.quotations.id });

      const variantRows =
        [] as (typeof schema.quotationVariants.$inferInsert)[];
      for (const v of dto.variants) {
        const variant = await tx.query.productListingVariants.findFirst({
          where: eq(
            schema.productListingVariants.id,
            v.productListingVariantId,
          ),
        });
        if (!variant)
          throw new NotFoundException(
            `Variant ${v.productListingVariantId} not found`,
          );

        variantRows.push({
          quotationId: quotation.id,
          productListingVariantId: variant.id,
          originalPricePerUnit: variant.pricePerUnit,
          adminSuggestedPricePerUnit: v.adminSuggestedPricePerUnit,
          quantity: v.quantity,
        });
      }

      await tx.insert(schema.quotationVariants).values(variantRows).returning();
      return { quotationId: quotation.id };
    });
  }

  async findAllForVendor(vendorId: string) {
    return this.db.query.quotations.findMany({
      where: and(
        eq(schema.quotations.vendorId, vendorId),
        eq(schema.quotations.isApprovedByAdmin, true),
      ),
      with: { variants: true },
    });
  }

  async vendorAccept(id: number, vendorId: string) {
    const quotation = await this.getOrThrow(id);
    this.assertVendorOwnsAndVisible(quotation, vendorId);

    const [updated] = await this.db
      .update(schema.quotations)
      .set({ isApprovedByVendor: true, updatedAt: sql`(current_timestamp)` })
      .where(eq(schema.quotations.id, id))
      .returning({ id: schema.quotations.id });

    await this.notificationsService.create({
      type: 'admin',
      subType: 'vendor_replied_quotation',
      referenceId: String(updated.id),
      referenceType: 'quotation',
      message: `Vendor accepted quotation #${updated.id}`,
    });

    return updated;
  }

  async vendorCounter(
    id: number,
    vendorId: string,
    dto: IVendorCounterQuotationDto,
  ) {
    const quotation = await this.getOrThrow(id);
    this.assertVendorOwnsAndVisible(quotation, vendorId);

    return this.db.transaction(async (tx) => {
      for (const v of dto.variants) {
        await tx
          .update(schema.quotationVariants)
          .set({ vendorCounterPricePerUnit: v.vendorCounterPricePerUnit })
          .where(eq(schema.quotationVariants.id, v.quotationVariantId));
      }

      const [updated] = await tx
        .update(schema.quotations)
        .set({
          isVendorUpdatedTheQuotation: true,
          isApprovedByVendor: true,
          isApprovedByAdmin: false,
          updatedAt: sql`(current_timestamp)`,
        })
        .where(eq(schema.quotations.id, id))
        .returning({ id: schema.quotations.id });

      await this.notificationsService.create({
        type: 'admin',
        subType: 'vendor_replied_quotation',
        referenceId: String(updated.id),
        referenceType: 'quotation',
        message: `Vendor countered on quotation #${updated.id}`,
      });

      return updated;
    });
  }

  async reapprove(id: number) {
    const quotation = await this.getOrThrow(id);
    if (!quotation.isVendorUpdatedTheQuotation) {
      throw new BadRequestException(
        'This quotation has no vendor counter to reapprove',
      );
    }

    const [updated] = await this.db
      .update(schema.quotations)
      .set({
        isReapprovedByAdmin: true,
        isApprovedByAdmin: true,
        updatedAt: sql`(current_timestamp)`,
      })
      .where(eq(schema.quotations.id, id))
      .returning({
        id: schema.quotations.id,
        vendorId: schema.quotations.vendorId,
      });

    await this.notificationsService.create({
      type: 'vendor',
      subType: 'admin_filed_quotation',
      vendorId: updated.vendorId,
      referenceId: String(updated.id),
      referenceType: 'quotation',
      message: `Admin accepted your counter on quotation #${updated.id}`,
    });

    return updated;
  }

  // findAll() {
  //   return `This action returns all quotation`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} quotation`;
  // }

  // update(id: number, updateQuotationDto: UpdateQuotationDto) {
  //   return `This action updates a #${id} quotation`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} quotation`;
  // }
}
