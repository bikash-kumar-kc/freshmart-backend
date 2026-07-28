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
import { eq } from 'drizzle-orm';

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
        .returning();

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

      const insertedVariants = await tx
        .insert(schema.quotationVariants)
        .values(variantRows)
        .returning();
      return { ...quotation, variants: insertedVariants };
    });
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
