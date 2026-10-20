import { Equals, IsEmail, IsNotEmpty, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { Match } from '../../../utils/match.decorator.js';
import { Trim, TrimLowerCase } from '../../../utils/transforms.js';
import { PHONE_REGEX } from '../../users/dtos/user.dtos.js';

export class RegisterDto {
  @Trim()
  @IsString({ message: 'Họ tên không hợp lệ' })
  @Length(2, 100, { message: 'Họ tên phải từ 2 đến 100 ký tự' })
  fullName: string;

  @TrimLowerCase()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(150, { message: 'Email tối đa 150 ký tự' })
  email: string;

  @Trim()
  @Matches(PHONE_REGEX, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @IsString({ message: 'Mật khẩu không hợp lệ' })
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu tối đa 72 ký tự' })
  password: string;

  @Match('password', { message: 'Mật khẩu xác nhận không khớp' })
  confirmPassword: string;

  @Equals(true, { message: 'Bạn cần đồng ý với điều khoản sử dụng' })
  acceptTerms: boolean;
}

export class LoginDto {
  @Trim()
  @Matches(PHONE_REGEX, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @IsString({ message: 'Vui lòng nhập mật khẩu' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  password: string;
}

export class ForgotPasswordDto {
  @TrimLowerCase()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}

export class VerifyOtpDto {
  @TrimLowerCase()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @Trim()
  @Matches(/^\d{6}$/, { message: 'Mã OTP gồm đúng 6 chữ số' })
  otp: string;
}

export class ResetPasswordDto {
  @IsString({ message: 'Mã đặt lại mật khẩu không hợp lệ' })
  @IsNotEmpty({ message: 'Mã đặt lại mật khẩu không được để trống' })
  resetToken: string;

  @IsString({ message: 'Mật khẩu mới không hợp lệ' })
  @MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu mới tối đa 72 ký tự' })
  newPassword: string;

  @Match('newPassword', { message: 'Mật khẩu xác nhận không khớp' })
  confirmPassword: string;
}
