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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SetupAccountDto } from './dto/setup-account.dto';
import { LoginDto } from './dto/login.dto';
import { JWT_CONSTANTS } from './utilis/constant/jwtToken.constant';
import { ILoginResponseType } from './types/login.type';
import { IRegisterType } from './types/register.type';
import { AuthGuard } from './auth.guard';
import { IPayloadType } from './types/token.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('setup-account')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'vendor/admin sets email + password ' })
  async create(@Body() setupAccountDto: SetupAccountDto) {
    const response: IRegisterType =
      await this.authService.create(setupAccountDto);
    return response;
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Login for user, vendor, or admin — role determined by the account',
  })
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

    res.cookie('accessToken', accessToken, {
      httpOnly: false,
      // secure: process.env.NODE_ENV === 'production',
      secure: process.env.NPM_CONFIG_PRODUCTION === 'false',
      // sameSite: 'lax',
      sameSite: 'none',
      maxAge: JWT_CONSTANTS.accessTtl,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      secure: process.env.NPM_CONFIG_PRODUCTION === 'false',
      // sameSite: 'lax',
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
      // secure: process.env.NODE_ENV === 'production',
      secure: process.env.NPM_CONFIG_PRODUCTION === 'false',
      sameSite: 'none',
      maxAge: JWT_CONSTANTS.accessTtl,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      secure: process.env.NPM_CONFIG_PRODUCTION === 'false',
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
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    return { message: 'Logged out' };
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'user gets its information' })
  async getCurrentUser(@Req() req: Request) {
    const { sub } = req['user'] as IPayloadType;
    return this.authService.getCurrentUser(sub);
  }

  // @Get()
  // findAll() {
  //   return this.authService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.authService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.authService.remove(+id);
  // }
}
