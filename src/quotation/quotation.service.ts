import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { DB_PROVIDER } from '../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { NotificationService } from '../notification/notification.service';
import { and, eq, or, sql } from 'drizzle-orm';
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

  async send(id: number) {
    const quotation = await this.getOrThrow(id);
    if (quotation.isApprovedByAdmin) {
      throw new BadRequestException('Quotation already sent');
    }

    const [updated] = await this.db
      .update(schema.quotations)
      .set({ isApprovedByAdmin: true, updatedAt: sql`(current_timestamp)` })
      .where(eq(schema.quotations.id, id))
      .returning();

    await this.notificationsService.create({
      type: 'vendor',
      subType: 'admin_filed_quotation',
      vendorId: quotation.vendorId,
      referenceId: String(quotation.id),
      referenceType: 'quotation',
      message: 'You have received a new quotation — take a look',
    });

    return updated;
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

  async remove(id: number) {
    await this.getOrThrow(id);
    await this.db.delete(schema.quotations).where(eq(schema.quotations.id, id));
    return { message: 'Quotation deleted' };
  }

  async markDelivered(id: number) {
    const quotation = await this.getOrThrow(id);
    if (quotation.isDelivered) {
      throw new BadRequestException('Quotation is already marked as delivered');
    }

    const [updated] = await this.db
      .update(schema.quotations)
      .set({ isDelivered: true, updatedAt: sql`(current_timestamp)` })
      .where(eq(schema.quotations.id, id))
      .returning({ id: schema.quotations.id });

    await this.notificationsService.create({
      type: 'vendor',
      subType: 'admin_filed_quotation',
      vendorId: String(updated.id),
      referenceId: String(updated.id),
      referenceType: 'quotation',
      message: `Admin confirmed receipt of your delivery for quotation #${updated.id}`,
    });

    return updated;
  }

  async findAllForAdmin(status?: 'draft' | 'sent') {
    if (status === 'draft') {
      return this.db.query.quotations.findMany({
        where: and(
          eq(schema.quotations.isApprovedByAdmin, false),
          eq(schema.quotations.isVendorUpdatedTheQuotation, false),
        ),
        with: { variants: true },
      });
    }

    if (status === 'sent') {
      return this.db.query.quotations.findMany({
        where: eq(schema.quotations.isApprovedByAdmin, true),
        with: { variants: true },
      });
    }

    return this.db.query.quotations.findMany({ with: { variants: true } });
  }

  async findOneForAdmin(id: string) {
    return this.db.query.quotations.findFirst({
      where: eq(schema.quotations.id, Number(id)),
      with: {
        variants: true,
      },
    });
  }

  async findPendingForVendor(vendorId: string) {
    return this.db.query.quotations.findMany({
      where: and(
        eq(schema.quotations.vendorId, vendorId),
        eq(schema.quotations.isApprovedByAdmin, true),
        eq(schema.quotations.isApprovedByVendor, false),
        eq(schema.quotations.isVendorUpdatedTheQuotation, false),
        eq(schema.quotations.isDelivered, false),
      ),
    });
  }

  async findRespondedForVendor(vendorId: string) {
    return this.db.query.quotations.findMany({
      where: and(
        eq(schema.quotations.vendorId, vendorId),
        or(
          eq(schema.quotations.isApprovedByVendor, true),
          eq(schema.quotations.isVendorUpdatedTheQuotation, true),
        ),
        eq(schema.quotations.isDelivered, false),
      ),
    });
  }

  async findOneForVendor(id: string, vendorId: string) {
    const quotation = await this.getOrThrow(Number(id));
    this.assertVendorOwnsAndVisible(quotation, vendorId);

    return this.db.query.quotations.findFirst({
      where: and(
        eq(schema.quotations.vendorId, vendorId),
        eq(schema.quotations.id, Number(id)),
      ),
      with: {
        variants: true,
      },
    });
  }

  async findQuotationDelivered(vendorId: string) {
    return this.db.query.quotations.findMany({
      where: and(
        eq(schema.quotations.vendorId, vendorId),
        eq(schema.quotations.isDelivered, true),
        eq(schema.quotations.isReapprovedByAdmin, true),
      ),
    });
  }

  private async getOrThrow(id: number) {
    const quotation = await this.db.query.quotations.findFirst({
      where: eq(schema.quotations.id, id),
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    return quotation;
  }

  private assertVendorOwnsAndVisible(
    quotation: typeof schema.quotations.$inferSelect,
    vendorId: string,
  ) {
    if (quotation.vendorId !== vendorId)
      throw new ForbiddenException('You do not own this quotation');
    if (!quotation.isApprovedByAdmin)
      throw new BadRequestException(
        'This quotation has not been sent to you yet',
      );
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
