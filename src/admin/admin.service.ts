import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DB_PROVIDER } from '../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { and, eq, SQL, sql } from 'drizzle-orm';
import { IListVendorsQueryDto } from './dto/list-vendors-query..dto';
import { IAdminUpdateVendorDto } from './dto/admin-update-vendor.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
    // @Inject(REDIS_PROVIDER) private readonly redis: Redis,
    @InjectQueue('otp-email') private readonly otpQueue: Queue,
  ) {}

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

  async listVendors(query: IListVendorsQueryDto) {
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

    return this.db.query.vendors.findMany({
      where: conditions.length ? and(...conditions) : undefined,
    });
  }

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
      with: {
        variants: true,
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

    return updated;
  }

  // create(createAdminDto: CreateAdminDto) {
  //   return 'This action adds a new admin';
  // }

  // findAll() {
  //   return `This action returns all admin`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} admin`;
  // }

  // update(id: number, updateAdminDto: UpdateAdminDto) {
  //   return `This action updates a #${id} admin`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} admin`;
  // }
}
