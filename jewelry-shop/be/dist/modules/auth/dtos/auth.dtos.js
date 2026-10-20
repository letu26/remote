var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Equals, IsEmail, IsNotEmpty, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { Match } from '../../../utils/match.decorator.js';
import { Trim, TrimLowerCase } from '../../../utils/transforms.js';
import { PHONE_REGEX } from '../../users/dtos/user.dtos.js';
export class RegisterDto {
    fullName;
    email;
    phone;
    password;
    confirmPassword;
    acceptTerms;
}
__decorate([
    Trim(),
    IsString({ message: 'Họ tên không hợp lệ' }),
    Length(2, 100, { message: 'Họ tên phải từ 2 đến 100 ký tự' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "fullName", void 0);
__decorate([
    TrimLowerCase(),
    IsEmail({}, { message: 'Email không hợp lệ' }),
    MaxLength(150, { message: 'Email tối đa 150 ký tự' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    Trim(),
    Matches(PHONE_REGEX, { message: 'Số điện thoại không hợp lệ' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    IsString({ message: 'Mật khẩu không hợp lệ' }),
    MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' }),
    MaxLength(72, { message: 'Mật khẩu tối đa 72 ký tự' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    Match('password', { message: 'Mật khẩu xác nhận không khớp' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "confirmPassword", void 0);
__decorate([
    Equals(true, { message: 'Bạn cần đồng ý với điều khoản sử dụng' }),
    __metadata("design:type", Boolean)
], RegisterDto.prototype, "acceptTerms", void 0);
export class LoginDto {
    phone;
    password;
}
__decorate([
    Trim(),
    Matches(PHONE_REGEX, { message: 'Số điện thoại không hợp lệ' }),
    __metadata("design:type", String)
], LoginDto.prototype, "phone", void 0);
__decorate([
    IsString({ message: 'Vui lòng nhập mật khẩu' }),
    IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
export class ForgotPasswordDto {
    email;
}
__decorate([
    TrimLowerCase(),
    IsEmail({}, { message: 'Email không hợp lệ' }),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
export class VerifyOtpDto {
    email;
    otp;
}
__decorate([
    TrimLowerCase(),
    IsEmail({}, { message: 'Email không hợp lệ' }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "email", void 0);
__decorate([
    Trim(),
    Matches(/^\d{6}$/, { message: 'Mã OTP gồm đúng 6 chữ số' }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "otp", void 0);
export class ResetPasswordDto {
    resetToken;
    newPassword;
    confirmPassword;
}
__decorate([
    IsString({ message: 'Mã đặt lại mật khẩu không hợp lệ' }),
    IsNotEmpty({ message: 'Mã đặt lại mật khẩu không được để trống' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "resetToken", void 0);
__decorate([
    IsString({ message: 'Mật khẩu mới không hợp lệ' }),
    MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự' }),
    MaxLength(72, { message: 'Mật khẩu mới tối đa 72 ký tự' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
__decorate([
    Match('newPassword', { message: 'Mật khẩu xác nhận không khớp' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "confirmPassword", void 0);
//# sourceMappingURL=auth.dtos.js.map