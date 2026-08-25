import { ApiProperty } from '@nestjs/swagger';

class UserInfoDto {
  @ApiProperty({ example: 'randomId' })
  id!: string;

  @ApiProperty({ example: 'name@example.com' })
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  password!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    type: UserInfoDto,
    example: {
      id: 'randomId',
      email: 'name@example.com',
      password: 'StrongPass123!',
    },
  })
  user!: UserInfoDto;
  @ApiProperty({ example: 'Access token' })
  accessToken!: string;
}

export class RefreshResponseDto extends LoginResponseDto {}

export class LogoutResponseDto {
  @ApiProperty({ example: 'message' })
  message!: string;
}

export class GetCurrentUserDto {
  userId!: string;
  email!: string;
  role!: 'admin' | 'user' | 'vendor';
  vendorId!: string;
}

export class GetCurrentUserResponseDto {
  @ApiProperty({
    type: GetCurrentUserDto,
    example: {
      userId: 'random user id while creating the user account',
      email: 'name@gmail.com',
      role: 'role of the current user',
      vendorId: 'Id of the vendor id generated during the vendor registration',
    },
  })
  user!: GetCurrentUserDto;
}

export class VendorRegistrationDto {
  @ApiProperty({ example: 'ramdom vendor id' })
  id!: string;
  @ApiProperty({ example: 'name@gmail.com' })
  email!: string;
  @ApiProperty({ example: 'role of the vendor' })
  type!: 'user' | 'admin' | 'vendor';
}

export class ForgotPasswordResponseDto {
  @ApiProperty({ example: 'randome token ' })
  token!: string;
}
