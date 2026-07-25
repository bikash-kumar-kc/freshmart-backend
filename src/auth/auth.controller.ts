import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SetupAccountDto } from './dto/setup-account.dto';
import { LoginDto } from './dto/login.dto';
import { JWT_CONSTANTS } from './utilis/constant/jwtToken.constant';
import { ILoginResponseType, IRefreshType } from './types/login.type';
import { IRegisterType } from './types/register.type';

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
    const { accessToken, refreshToken, userId }: ILoginResponseType =
      await this.authService.login(loginDto);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: JWT_CONSTANTS.accessTtl,
      path: '/auth/refresh',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: JWT_CONSTANTS.refreshTtl,
      path: '/auth/refresh',
    });

    return { accessToken, userId };
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
