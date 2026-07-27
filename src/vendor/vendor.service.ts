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
import { and, eq, sql } from 'drizzle-orm';
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
          images: dto.images ?? [],
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

    return response;
  }

  async findAllByVendor(vendorId: string, isVerified: boolean) {
    const response = await this.db.query.productListing.findMany({
      where: and(
        eq(schema.productListing.vendorId, vendorId),
        eq(schema.productListing.isAcceptedByAdmin, isVerified),
      ),
      with: {
        variants: true,
      },
    });

    return response;
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

    return this.db.transaction(async (tx) => {
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

      return { ...updated, variants: updatedVariants as ICreateVariantDto };
    });
  }

  // product-listing/product-listing.service.ts (addition)
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

    return { message: 'Product listing deleted successfully' };
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
