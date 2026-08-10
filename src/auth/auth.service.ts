import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SetupAccountDto } from './dto/setup-account.dto';
import { DB_PROVIDER } from '../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { BCRYPT_CONSTANTS } from './utilis/constant/bcrypt.constant';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { IPayloadType } from './types/token.type';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  async create(dto: SetupAccountDto) {
    const { email, password, isVendor } = dto;

    let vendor: unknown;
    if (isVendor) {
      vendor = await this.db.query.vendors.findFirst({
        where: eq(schema.vendors.email, email),
        columns: {
          id: true,
        },
      });

      if (!vendor) {
        throw new BadRequestException(
          'No vendor application found for this email',
        );
      }

      if (!schema.vendors.isVendorApproved) {
        throw new BadRequestException('Your application is still under review');
      }
    }

    const existingUser = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
      columns: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'Account already exists — please log in instead',
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      BCRYPT_CONSTANTS.saltRound,
    );

    const [newUser] = await this.db
      .insert(schema.users)
      .values({
        email: email,
        password: hashedPassword,
        role: isVendor ? 'vendor' : 'user',
        vendorId: isVendor ? (vendor as { id: string }).id : null,
        isEmailVerified: true,
      })
      .returning();

    return { id: newUser.id, email: newUser.email, role: newUser.role };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      role: user.role,
      vendorId: user.vendorId,
      adminId: user.adminId,
    };

    if (!process.env.JWT_SECRET || !process.env.JWT_ACCESS_EXPIRY) {
      throw new InternalServerErrorException();
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRY as StringValue,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRY as StringValue,
    });

    return {
      accessToken,
      refreshToken,
      userId: user.id,
      role: user.role,
      email: user.email,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload: IPayloadType = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET!,
        },
      );

      const [isUserExist] = await this.db
        .select({
          userId: schema.users.id,
          role: schema.users.role,
          email: schema.users.email,
          vendorId: schema.users.vendorId,
          adminId: schema.users.adminId,
        })
        .from(schema.users)
        .where(eq(schema.users.id, payload.sub));

      if (!isUserExist) {
        throw new NotFoundException('User not found');
      }

      const jwtPayload = {
        sub: isUserExist.userId,
        role: isUserExist.role,
        vendorId: isUserExist.vendorId,
        adminId: isUserExist.adminId,
      };

      const newAccessToken = await this.jwtService.signAsync(
        {
          ...jwtPayload,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_ACCESS_EXPIRY as StringValue,
        },
      );

      const newRefreshToken = await this.jwtService.signAsync(
        {
          ...jwtPayload,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_ACCESS_EXPIRY as StringValue,
        },
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        userId: isUserExist.userId,
        role: isUserExist.role,
        email: isUserExist.email,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getCurrentUser(userId: string) {
    const [isExist] = await this.db
      .select({
        userId: schema.users.id,
        email: schema.users.email,
        role: schema.users.role,
        vendorId: schema.users.vendorId,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!isExist) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        userId: isExist.userId,
        email: isExist.email,
        role: isExist.role,
        vendorId: isExist.vendorId,
      },
    };
  }
}

// findAll() {
//   return `This action returns all auth`;
// }

// findOne(id: number) {
//   return `This action returns a #${id} auth`;
// }

// update(id: number, updateAuthDto: UpdateAuthDto) {
//   return `This action updates a #${id} auth`;
// }

// remove(id: number) {
//   return `This action removes a #${id} auth`;
// }
