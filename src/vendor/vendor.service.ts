import {
  BadRequestException,
  ConflictException,
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
import { eq } from 'drizzle-orm';
import { VENDOR_CONSTANTS } from './constants/constant';
import { IOtpRecord } from './types/otp-record.type';
import { IResendOtpDto } from './dto/resend-otp.dto';
import { IVerifyOtpDto } from './dto/verify-otp.dto';

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
