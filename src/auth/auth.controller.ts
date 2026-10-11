import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SetupAccountDto } from './dto/setup-account.dto';
import { LoginDto } from './dto/login.dto';
import { JWT_CONSTANTS } from './utilis/constant/jwtToken.constant';
import { ILoginResponseType } from './types/login.type';
import { IRegisterType } from './types/register.type';
import { AuthGuard } from './auth.guard';
import { IPayloadType } from './types/token.type';
import {
  GetCurrentUserResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  RefreshResponseDto,
  VendorRegistrationDto,
} from './dto/response.dto';
import {
  PasswordResetDto,
  VerifyPasswordResetDto,
} from './dto/passwordReset.dto';
import { IVerifyOtpDto } from '../vendor/dto/verify-otp.dto';
import { IResendOtpDto } from '../vendor/dto/resend-otp.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('setup-account')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'vendor/admin sets email + password ' })
  @ApiResponse({ type: VendorRegistrationDto })
  async create(@Body() setupAccountDto: SetupAccountDto) {
    const response: IRegisterType =
      await this.authService.create(setupAccountDto);
    return response;
  }

  // define response type...
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Login for user, vendor, or admin — role determined by the account',
  })
  @ApiResponse({ type: LoginResponseDto })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const {
      accessToken,
      refreshToken,
      userId,
      role,
      email,
    }: ILoginResponseType = await this.authService.login(loginDto);

    const accessTokenName = !loginDto.isVendor
      ? 'freshmartaccessTokenbackend'
      : 'accessToken';

    res.cookie(accessTokenName, accessToken, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      maxAge: JWT_CONSTANTS.accessTtl,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: JWT_CONSTANTS.refreshTtl,
      path: '/',
    });

    return {
      user: {
        id: userId,
        email,
        role,
      },
      accessToken,
    };
  }

  @Post('refresh')
  @ApiResponse({ type: RefreshResponseDto })
  async refresh(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.['refreshToken'] as string | undefined;
    if (!token) {
      return { accessToken: null };
    }
    const {
      accessToken,
      refreshToken,
      userId,
      role,
      email,
    }: ILoginResponseType = await this.authService.refresh(token);

    res.cookie('accessToken', accessToken, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      maxAge: JWT_CONSTANTS.accessTtl,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: JWT_CONSTANTS.refreshTtl,
      path: '/',
    });

    return {
      accessToken,
      user: {
        id: userId,
        email,
        role,
      },
    };
  }

  @Post('logout')
  @ApiResponse({ type: LogoutResponseDto })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    return { message: 'Logged out' };
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'user gets its information' })
  @ApiResponse({ type: GetCurrentUserResponseDto })
  async getCurrentUser(@Req() req: Request) {
    const { sub } = req['user'] as IPayloadType;
    return this.authService.getCurrentUser(sub);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'User request for password reset' })
  passwordResetRequest(@Body() body: PasswordResetDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'User change its password' })
  passwordReset(@Body() body: VerifyPasswordResetDto) {
    return this.authService.passwordReset(body);
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'verify user email' })
  async verifyOtp(@Body() dto: IVerifyOtpDto) {
    await this.authService.verifyOtp(dto);
  }

  @Post('resend-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'resend otp' })
  async resendOtp(@Body() dto: IResendOtpDto) {
    await this.authService.resendotp(dto);
  }
}
