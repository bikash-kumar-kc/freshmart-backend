import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplyVendorDto } from './dto/apply-vendor.dto';
import { InjectQueue } from '@nestjs/bullmq';
import Redis from 'ioredis';
import * as schema from '../db/schema';
import { DB_PROVIDER } from '../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { REDIS_PROVIDER } from '../redis/redis.provider';
import { Queue } from 'bullmq';
import {
  and,
  count,
  // countDistinct,
  eq,
  inArray,
  like,
  or,
  SQL,
  sql,
} from 'drizzle-orm';
import { VENDOR_CONSTANTS } from './constants/constant';
import { IOtpRecord } from './types/otp-record.type';
import { IResendOtpDto } from './dto/resend-otp.dto';
import { IVerifyOtpDto } from './dto/verify-otp.dto';
import { ICreateProductListingDto } from './dto/create-product-listing.dto';
import { IProductType } from './types/product.type';
import { IUpdateProductListingDto } from './dto/update-product-listing.dto';
import { ICreateVariantDto } from './dto/create-variant.dto';

@Injectable()
export class VendorService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
    @Inject(REDIS_PROVIDER) private readonly redis: Redis,
    @InjectQueue('otp-email') private readonly otpQueue: Queue,
  ) {}

  async apply(dto: ApplyVendorDto) {
    const existing = await this.db.query.vendors.findFirst({
      where: eq(schema.vendors.email, dto.email),
    });

    if (existing) {
      throw new ConflictException(
        'An application with this email already exists',
      );
    }

    const [vendor] = await this.db
      .insert(schema.vendors)
      .values(dto)
      .returning();

    await this.generateAndSendOtp(vendor.id, dto.email);

    await this.otpQueue.add(
      'cleanup-unverified-vendor',
      { vendorId: vendor.id },
      { delay: VENDOR_CONSTANTS.OTP_TTL_SECONDS * 1000 },
    );

    await this.db.insert(schema.notificationsVendorAdmin).values({
      type: 'admin',
      subType: 'vendor_registration_filed',
      referenceId: vendor.id,
      referenceType: 'vendor',
      message: 'New Vendor Registration Request. Take a look',
    });

    return {
      id: vendor.id,
      email: vendor.email,
      message:
        'Application submitted. Check your email for a verification code.',
    };
  }

  async resendOtp(dto: IResendOtpDto) {
    const vendor: { isEmailVerified: boolean; id: string } =
      await this.getVendorByEmailOrThrow(dto.email);

    if (vendor.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const existingRaw = await this.redis.get(`otp:${vendor.id}`);

    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as IOtpRecord;
      if (
        Date.now() - existing.lastSentAt <
        VENDOR_CONSTANTS.RESEND_COOLDOWN_MS
      ) {
        throw new BadRequestException(
          'Please wait before requesting another code',
        );
      }
    }

    await this.generateAndSendOtp(vendor.id, dto.email);
    return { message: 'A new verification code has been sent' };
  }

  private async generateAndSendOtp(vendorId: string, email: string) {
    // random code...
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // otp record for tracking the user attempt for an otp...
    const otpRecord: IOtpRecord = {
      code,
      expiresAt: Date.now() + VENDOR_CONSTANTS.OTP_EXPIRY_MS,
      attemptsUsed: 0,
      lastSentAt: Date.now(),
    };

    // restoring the otprecord in redis...
    await this.redis.set(
      `otp:${vendorId}`,
      JSON.stringify(otpRecord),
      'EX',
      VENDOR_CONSTANTS.OTP_EXPIRY_MS,
    );

    // adding the job to send email...
    await this.otpQueue.add('send-otp-email', {
      email,
      otp: code,
      type: 'otp',
    });
  }

  async verifyOtp(dto: IVerifyOtpDto) {
    const vendor = await this.getVendorByEmailOrThrow(dto.email);
    if (vendor.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const raw = await this.redis.get(`otp:${vendor.id}`);
    if (!raw) {
      throw new BadRequestException(
        'No active verification code — please request a new one',
      );
    }

    const record = (await JSON.parse(raw)) as IOtpRecord;

    if (Date.now() > record.expiresAt) {
      await this.redis.del(`otp:${vendor.id}`);
      throw new BadRequestException(
        'Verification code expired — please request a new one',
      );
    }

    if (record.attemptsUsed >= VENDOR_CONSTANTS.MAX_ATTEMPTS) {
      await this.redis.del(`otp:${vendor.id}`);
      throw new BadRequestException(
        'Too many attempts — please request a new code',
      );
    }

    if (record.code !== dto.otp) {
      record.attemptsUsed += 1;
      const remainingTtl = Math.ceil((record.expiresAt - Date.now()) / 1000);
      await this.redis.set(
        `otp:${vendor.id}`,
        JSON.stringify(record),
        'EX',
        remainingTtl,
      );

      if (record.attemptsUsed >= VENDOR_CONSTANTS.MAX_ATTEMPTS) {
        await this.redis.del(`otp:${vendor.id}`);
        throw new BadRequestException(
          'Too many incorrect attempts — please request a new code',
        );
      }

      throw new BadRequestException(
        `Incorrect code — ${VENDOR_CONSTANTS.MAX_ATTEMPTS - record.attemptsUsed} attempt(s) remaining`,
      );
    }

    await this.redis.del(`otp:${vendor.id}`);
    await this.db
      .update(schema.vendors)
      .set({ isEmailVerified: true })
      .where(eq(schema.vendors.id, vendor.id));

    return { message: 'Email verified successfully' };
  }

  private async getVendorByEmailOrThrow(email: string) {
    const vendor = await this.db.query.vendors.findFirst({
      where: eq(schema.vendors.email, email),
    });
    if (!vendor)
      throw new NotFoundException('No application found for this email');
    return vendor;
  }

  async getVendorById(vendorId: string) {
    const vendor = await this.db
      .select()
      .from(schema.vendors)
      .where(eq(schema.vendors.id, vendorId));
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async create(vendorId: string, dto: ICreateProductListingDto) {
    if (dto.type === IProductType.INVENTORY) {
      const missingSellingPrice = dto.variants.some(
        (v) => v.sellingPrice === undefined,
      );

      if (missingSellingPrice) {
        throw new BadRequestException(
          'sellingPrice is required for every variant when type is "inventory"',
        );
      }
    }

    const response = await this.db.transaction(async (tx) => {
      const [listing] = await tx
        .insert(schema.productListing)
        .values({
          vendorId,
          productId: dto.productId,
          type: dto.type,
          localName: dto.localName,
          categoryId: dto.categoryId,
          keywords: dto.keywords,
          description: dto.description,
          images:
            dto.images.map((i) => ({ url: i.url, fileId: i.fileId })) ?? [],
          originCountry: dto.originCountry,
          farmName: dto.farmName,
          packagingTypeId: dto.packagingTypeId,
          isTaxable: dto.isTaxable ?? false,
          isAcceptedByAdmin: false,
        })
        .returning();

      const variantRows = dto.variants.map((variant) => ({
        productListingId: listing.id,
        size: variant.size,
        measurementId: variant.measurementId,
        quantity: variant.quantity,
        pricePerUnit: variant.pricePerUnit,
        sellingPrice:
          dto.type === IProductType.INVENTORY ? variant.sellingPrice : null,
      }));

      const variants = await tx
        .insert(schema.productListingVariants)
        .values(variantRows)
        .returning();

      return { ...listing, variants };
    });

    await this.db.insert(schema.notificationsVendorAdmin).values({
      type: 'admin',
      subType: 'vendor_added_product',
      referenceId: String(response.id),
      referenceType: 'productListing',
      message: 'Vendor added new Product. Verify the product.',
    });

    const cacheKey: string = 'productlisting:getproduct';
    await this.clearCaching(cacheKey);

    return response;
  }

  async findAllByVendor(
    vendorId: string,
    isVerified: boolean,
    page = 1,
    limit = 10,
  ) {
    const offset = (page - 1) * limit;

    const response = await this.db.query.productListing.findMany({
      where: and(
        eq(schema.productListing.vendorId, vendorId),
        eq(schema.productListing.isAcceptedByAdmin, isVerified),
      ),
      with: {
        variants: true,
      },
      limit,
      offset,
    });

    const [{ totalProducts }] = await this.db
      .select({ totalProducts: count() })
      .from(schema.productListing)
      .where(
        and(
          eq(schema.productListing.vendorId, vendorId),
          eq(schema.productListing.isAcceptedByAdmin, isVerified),
        ),
      );

    const totalPages = Math.ceil(totalProducts / limit);

    return {
      data: response,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      limit,
      totalProducts,
    };
  }

  async update(id: number, vendorId: string, dto: IUpdateProductListingDto) {
    const listing = await this.db.query.productListing.findFirst({
      where: eq(schema.productListing.id, id),
    });

    if (!listing) {
      throw new NotFoundException('Product listing not found');
    }

    if (listing.vendorId !== vendorId) {
      throw new ForbiddenException('You do not own this resource');
    }

    if (listing.isAcceptedByAdmin) {
      throw new BadRequestException(
        'This listing is approved and can no longer be edited by the vendor',
      );
    }

    if (dto.type === IProductType.INVENTORY) {
      const missingSellingPrice = dto.variants?.some(
        (v) => v.sellingPrice === undefined,
      );

      if (missingSellingPrice) {
        throw new BadRequestException(
          'sellingPrice is required for every variant when type is "inventory"',
        );
      }
    }
    const res = await this.db.transaction(async (tx) => {
      const { variants, ...listingFields } = dto;

      const [updated] = await tx
        .update(schema.productListing)
        .set({ ...listingFields, updatedAt: sql`(current_timestamp)` })
        .where(eq(schema.productListing.id, id))
        .returning();

      let updatedVariants: unknown;

      if (variants) {
        await tx
          .delete(schema.productListingVariants)
          .where(eq(schema.productListingVariants.productListingId, id));

        updatedVariants = await tx
          .insert(schema.productListingVariants)
          .values(
            variants.map((v) => ({
              productListingId: id,
              size: v.size,
              measurementId: v.measurementId,
              quantity: v.quantity,
              pricePerUnit: v.pricePerUnit,
              sellingPrice:
                listing.type === 'inventory' ? v.sellingPrice : null,
            })),
          )
          .returning();
      }

      await tx.insert(schema.notificationsVendorAdmin).values({
        type: 'admin',
        subType: 'vendor_edited_product',
        referenceId: String(updated.id),
        referenceType: 'productListing',
        message:
          'Vendor updated its one of the product. Take a look and take action',
      });
      return { ...updated, variants: updatedVariants as ICreateVariantDto };
    });

    const cacheKey: string = 'productlisting:getproduct';
    await this.clearCaching(cacheKey);
    return res;
  }

  async remove(id: number, vendorId: string) {
    const listing = await this.db.query.productListing.findFirst({
      where: eq(schema.productListing.id, id),
    });

    if (!listing) {
      throw new NotFoundException('Product listing not found');
    }

    if (listing.vendorId !== vendorId) {
      throw new ForbiddenException('You do not own this resource');
    }

    await this.db
      .delete(schema.productListing)
      .where(eq(schema.productListing.id, id));

    const cacheKey: string = 'productlisting:getproduct';
    await this.clearCaching(cacheKey);

    return { message: 'Product listing deleted successfully' };
  }

  async getVendorStats(vendorId: string) {
    const promiseArray = [
      this.db
        .select({ totalProducts: count() })
        .from(schema.productListing)
        .where(eq(schema.productListing.vendorId, vendorId)),

      this.db
        .select({ totalRejectedProducts: count() })
        .from(schema.productListing)
        .where(
          and(
            eq(schema.productListing.vendorId, vendorId),
            eq(schema.productListing.isRejectedByAdmin, true),
          ),
        ),

      this.db
        .select({ totalLiveProducts: count() })
        .from(schema.productListing)
        .where(
          and(
            eq(schema.productListing.vendorId, vendorId),
            eq(schema.productListing.isLived, true),
          ),
        ),

      this.db
        .select({ totalApprovedProducts: count() })
        .from(schema.productListing)
        .where(
          and(
            eq(schema.productListing.vendorId, vendorId),
            eq(schema.productListing.isAcceptedByAdmin, true),
          ),
        ),
      this.db
        .select({ totalUnapprovedProducts: count() })
        .from(schema.productListing)
        .where(
          and(
            eq(schema.productListing.vendorId, vendorId),
            eq(schema.productListing.isAcceptedByAdmin, false),
          ),
        ),
      this.db
        .select({
          totalProductOrders: count(schema.orders.id),
        })
        .from(schema.orderItems)
        .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.id))
        .where(
          and(
            eq(schema.orderItems.vendorId, vendorId),
            inArray(schema.orders.displayOrderStatus, [
              'pending',
              'processing',
            ]),
          ),
        ),

      this.db
        .select({
          totalCancelledOrders: count(schema.orders.id),
        })
        .from(schema.orderItems)
        .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.id))
        .where(
          and(
            eq(schema.orderItems.vendorId, vendorId),
            inArray(schema.orders.displayOrderStatus, ['cancelled']),
          ),
        ),
      this.db
        .select({
          totalCompletedOrders: count(schema.orders.id),
        })
        .from(schema.orderItems)
        .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.id))
        .where(
          and(
            eq(schema.orderItems.vendorId, vendorId),
            inArray(schema.orders.displayOrderStatus, ['delivered']),
          ),
        ),

      this.db
        .select({ totalQuotationFromAdmin: count() })
        .from(schema.quotations)
        .where(
          and(
            eq(schema.quotations.vendorId, vendorId),
            eq(schema.quotations.isApprovedByAdmin, true),
          ),
        ),

      this.db
        .select({ totalQuotationToReviewByVendor: count() })
        .from(schema.quotations)
        .where(
          and(
            eq(schema.quotations.vendorId, vendorId),
            eq(schema.quotations.isApprovedByAdmin, true),
            eq(schema.quotations.isVendorUpdatedTheQuotation, false),
            eq(schema.quotations.isApprovedByVendor, false),
          ),
        ),
      this.db
        .select({ totalQuotationCounterByVendor: count() })
        .from(schema.quotations)
        .where(
          and(
            eq(schema.quotations.vendorId, vendorId),
            eq(schema.quotations.isApprovedByAdmin, true),
            eq(schema.quotations.isVendorUpdatedTheQuotation, true),
            eq(schema.quotations.isApprovedByVendor, true),
            eq(schema.quotations.isReapprovedByAdmin, false),
          ),
        ),
    ] as const;

    const [
      [totalResult],
      [{ totalRejectedProducts }],
      [{ totalLiveProducts }],
      [approvedResult],
      [unapprovedResult],
      [{ totalProductOrders }],
      [{ totalCancelledOrders }],
      [{ totalCompletedOrders }],
      [{ totalQuotationFromAdmin }],
      [{ totalQuotationToReviewByVendor }],
      [{ totalQuotationCounterByVendor }],
    ] = await Promise.all([...promiseArray]);

    const stats = {
      totalProducts: totalResult.totalProducts,
      totalRejectedProducts,
      totalLiveProducts,
      totalProductOrders,
      totalQuotationFromAdmin,
      totalQuotationToReviewByVendor,
      totalQuotationCounterByVendor,
      totalCompletedOrders,
      totalCancelledOrders,
      totalApprovedProducts: approvedResult.totalApprovedProducts,
      totalUnapprovedProducts: unapprovedResult.totalUnapprovedProducts,
    };

    return {
      ...stats,
    };
  }

  async findRejectedByAdmin(vendorId: string) {
    await this.db.query.productListing.findMany({
      where: and(
        eq(schema.productListing.vendorId, vendorId),
        eq(schema.productListing.isRejectedByAdmin, true),
      ),
    });

    const cacheKey: string = 'productlisting:getproduct';
    await this.clearCaching(cacheKey);
    return;
  }

  async searchByVendor(vendorId: string, q: string) {
    const conditions: SQL[] = [eq(schema.productListing.vendorId, vendorId)];

    const searchConditions: SQL[] = [];

    const asNumber = Number(q);
    if (!isNaN(asNumber)) {
      searchConditions.push(eq(schema.productListing.id, asNumber));
    }

    const matchingProductIds = await this.db
      .select({ id: schema.productName.id })
      .from(schema.productName)
      .where(like(schema.productName.name, `%${q}%`));

    if (matchingProductIds.length > 0) {
      searchConditions.push(
        inArray(
          schema.productListing.productId,
          matchingProductIds.map((p) => p.id),
        ),
      );
    }

    if (searchConditions.length === 0) {
      return [];
    }

    if (typeof searchConditions !== 'undefined') {
      conditions.push(or(...searchConditions)!);
    }

    return this.db.query.productListing.findMany({
      where: and(...conditions),
      with: { variants: true },
    });
  }

  private async clearCaching(key: string) {
    if (!key?.trim()) return;
    await this.redis.del(key);
    return;
  }

  // findAll() {
  //   return `This action returns all vendor`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} vendor`;
  // }

  // update(id: number, updateVendorDto: UpdateVendorDto) {
  //   return `This action updates a #${id} vendor`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} vendor`;
  // }
}
