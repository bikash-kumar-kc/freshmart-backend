// vendors/processors/vendor-cleanup.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_PROVIDER } from '../../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../../db/schema';
import { vendors } from '../../db/schema';

@Processor('otp-email')
export class VendorCleanupProcessor extends WorkerHost {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
  ) {
    super();
  }

  async process(job: Job<{ vendorId: string }>) {
    if (job.name !== 'cleanup-unverified-vendor') return;

    const { vendorId } = job.data;
    const vendor = await this.db.query.vendors.findFirst({
      where: eq(vendors.id, vendorId),
    });

    if (vendor && !vendor.isEmailVerified) {
      await this.db.delete(vendors).where(eq(vendors.id, vendorId));
    }
  }
}
