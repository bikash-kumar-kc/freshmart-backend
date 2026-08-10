import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DB_PROVIDER } from '../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { IGoLiveInventoryDto } from './dto/go-live-inventory.dto';
import { and, eq, inArray, sql } from 'drizzle-orm';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async goLiveFromQuotation(quotationId: number, dto: IGoLiveInventoryDto) {
    const quotation = await this.db.query.quotations.findFirst({
      where: eq(schema.quotations.id, quotationId),
      with: { variants: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');

    if (!quotation.isDelivered) {
      throw new BadRequestException(
        'Quotation has not been marked as delivered yet',
      );
    }
    if (quotation.isLived) {
      throw new BadRequestException(
        'This quotation has already been promoted to a live product',
      );
    }

    const listing = await this.db.query.productListing.findFirst({
      where: eq(schema.productListing.id, quotation.productListingId),
    });
    if (!listing)
      throw new NotFoundException('Source product listing not found');

    const category = await this.db.query.category.findFirst({
      where: eq(schema.category.id, listing.categoryId),
    });

    const productName = await this.db.query.productName.findFirst({
      where: eq(schema.productName.id, listing.productId),
    });

    if (!productName) throw new NotFoundException('Product name not found.');

    return this.db.transaction(async (tx) => {
      const slug = this.generateSlug(
        listing.localName as string,
        listing.farmName as string,
      );

      const data: typeof schema.products.$inferInsert = {
        slug: slug,
        productNameId: listing.productId,
        name: productName.name,
        vendorId: listing.vendorId,
        categoryId: listing.categoryId,
        type: 'inventory',
        description: listing.description,
        farmName: listing.farmName as string,
        originCountry: listing.originCountry,
        images: listing.images?.map((i) => i.url),
        isFeatured: false,
        keywords: listing.keywords as string,
        localName: listing.localName as string,
        category: category?.categoryName,
      };

      const [product] = await tx
        .insert(schema.products)
        .values({ ...data })
        .returning();

      const variants = await tx.query.productListingVariants.findMany({
        where: inArray(
          schema.quotations.id,
          quotation.variants.map((v) => v.quotationId),
        ),
      });

      if (!variants)
        throw new NotFoundException('quotation variants not found');

      const variantRows: (typeof schema.productVariants.$inferInsert)[] =
        quotation.variants.map((qv) => {
          const override = dto.variantQuantities.find(
            (v) => v.quotationVariantId === qv.id,
          );

          if (!override) {
            throw new BadRequestException(
              `Missing quantity for quotation variant ${qv.id}`,
            );
          }

          if (!variants.some((va) => va.id === qv.productListingVariantId)) {
            throw new NotFoundException('Varaiant not found');
          }

          const finalPrice = quotation.isVendorUpdatedTheQuotation
            ? qv.vendorCounterPricePerUnit
            : qv.adminSuggestedPricePerUnit;

          return {
            productId: product.id,
            weightValue: variants.find(
              (v) => v.id === qv.productListingVariantId,
            )!.size,
            measurementTypeId: variants.find(
              (v) => v.id === qv.productListingVariantId,
            )!.measurementId,
            quantity: override.quantity,
            price: finalPrice as number,
          };
        });

      await tx.insert(schema.productVariants).values(variantRows);

      await tx
        .update(schema.quotations)
        .set({ isLived: true, updatedAt: sql`(current_timestamp)` })
        .where(eq(schema.quotations.id, quotationId));

      return product;
    });
  }

  async goLiveFromDisplayListing(productListingId: number) {
    const listing = await this.db.query.productListing.findFirst({
      where: eq(schema.productListing.id, productListingId),
      with: { variants: true },
    });
    if (!listing) throw new NotFoundException('Product listing not found');
    if (listing.type !== 'display') {
      throw new BadRequestException('This route only handles Display listings');
    }
    if (!listing.isAcceptedByAdmin) {
      throw new BadRequestException('Listing has not been approved yet');
    }
    if (listing.isLived) {
      throw new BadRequestException(
        'This listing has already been promoted to a live product',
      );
    }

    const productName = await this.db.query.productName.findFirst({
      where: eq(schema.productName.id, listing.productId),
    });

    if (!productName) throw new NotFoundException('Product name not found.');

    const category = await this.db.query.category.findFirst({
      where: eq(schema.category.id, listing.categoryId),
    });

    if (!category) throw new NotFoundException('Category Not found');

    return this.db.transaction(async (tx) => {
      const slug = this.generateSlug(
        listing.localName as string,
        listing.farmName as string,
      );

      const data: typeof schema.products.$inferInsert = {
        slug,
        productNameId: listing.productId,
        name: productName.name,
        vendorId: listing.vendorId,
        categoryId: listing.categoryId,
        type: 'display',
        category: category.categoryName,
        description: listing.description,
        farmName: listing.farmName as string,
        originCountry: listing.originCountry,
        thumbnail: (listing.images?.map((i) => i.url) as string[])[0],
        images: listing.images?.map((i) => i.url),
        isFeatured: false,
        keywords: listing.keywords as string,
        localName: listing.localName as string,
      };

      const [product] = await tx
        .insert(schema.products)
        .values({
          ...data,
        })
        .returning();

      const variantRows: (typeof schema.productVariants.$inferInsert)[] =
        listing.variants.map((v) => ({
          productId: product.id,
          weightValue: v.size,
          measurementId: v.measurementId,
          quantity: v.quantity,
          price: v.pricePerUnit,
          weightUnit: 'kg',
        }));

      await tx.insert(schema.productVariants).values(variantRows);

      await tx
        .update(schema.productListing)
        .set({ isLived: true, updatedAt: sql`(current_timestamp)` })
        .where(eq(schema.productListing.id, productListingId));

      return product;
    });
  }

  async findReadyToGoLive() {
    return this.db.query.productListing.findMany({
      where: and(
        eq(schema.productListing.type, 'display'),
        eq(schema.productListing.isAcceptedByAdmin, true),
        eq(schema.productListing.isLived, false),
      ),
      with: { variants: true },
    });
  }

  private generateSlug(localName: string, farmName: string): string {
    return `${localName}-${farmName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // create(createProductDto: CreateProductDto) {
  //   return 'This action adds a new product';
  // }

  // findAll() {
  //   return `This action returns all products`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} product`;
  // }

  // update(id: number, updateProductDto: UpdateProductDto) {
  //   return `This action updates a #${id} product`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} product`;
  // }
}
