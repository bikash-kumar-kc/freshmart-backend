import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApplyVendorDto } from './dto/apply-vendor.dto';
import { VendorService } from './vendor.service';
import { IVerifyOtpDto } from './dto/verify-otp.dto';
import { IResendOtpDto } from './dto/resend-otp.dto';

@ApiTags('Vendors')
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorsService: VendorService) {}

  @Post('apply')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a new vendor application' })
  apply(@Body() dto: ApplyVendorDto) {
    return this.vendorsService.apply(dto);
  }

  @Post('otp/verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // generous — real limiting is the 5-attempt cap inside the OTP record itself
  @ApiOperation({ summary: 'Verify vendor application email with OTP' })
  verifyOtp(@Body() dto: IVerifyOtpDto) {
    return this.vendorsService.verifyOtp(dto);
  }

  @Post('otp/resend')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({ summary: 'Resend OTP for vendor email verification' })
  resendOtp(@Body() dto: IResendOtpDto) {
    return this.vendorsService.resendOtp(dto);
  }
}
