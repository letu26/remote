import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { Match } from '../../../utils/match.decorator.js';
import { Trim, TrimLowerCase } from '../../../utils/transforms.js';
import type { UserRole, UserStatus } from '../models/user.entity.js';

export const PHONE_REGEX = /^0\d{9}$/;

export class UpdateProfileDto {
  @IsOptional()
  @Trim()
  @IsString({ message: 'Họ tên không hợp lệ' })
  @Length(2, 100, { message: 'Họ tên phải từ 2 đến 100 ký tự' })
  fullName?: string;

  @IsOptional()
  @TrimLowerCase()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(150, { message: 'Email tối đa 150 ký tự' })
  email?: string;

  @IsOptional()
  @Trim()
  @Matches(PHONE_REGEX, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  currentPassword: string;

  @IsString({ message: 'Mật khẩu mới không hợp lệ' })
  @MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu mới tối đa 72 ký tự' })
  newPassword: string;

  @Match('newPassword', { message: 'Mật khẩu xác nhận không khớp' })
  confirmPassword: string;
}

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}
