var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { Match } from '../../../utils/match.decorator.js';
import { Trim, TrimLowerCase } from '../../../utils/transforms.js';
export const PHONE_REGEX = /^0\d{9}$/;
export class UpdateProfileDto {
    fullName;
    email;
    phone;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString({ message: 'Họ tên không hợp lệ' }),
    Length(2, 100, { message: 'Họ tên phải từ 2 đến 100 ký tự' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "fullName", void 0);
__decorate([
    IsOptional(),
    TrimLowerCase(),
    IsEmail({}, { message: 'Email không hợp lệ' }),
    MaxLength(150, { message: 'Email tối đa 150 ký tự' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    Trim(),
    Matches(PHONE_REGEX, { message: 'Số điện thoại không hợp lệ' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "phone", void 0);
export class ChangePasswordDto {
    currentPassword;
    newPassword;
    confirmPassword;
}
__decorate([
    IsString({ message: 'Vui lòng nhập mật khẩu hiện tại' }),
    IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    IsString({ message: 'Mật khẩu mới không hợp lệ' }),
    MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự' }),
    MaxLength(72, { message: 'Mật khẩu mới tối đa 72 ký tự' }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
__decorate([
    Match('newPassword', { message: 'Mật khẩu xác nhận không khớp' }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "confirmPassword", void 0);
//# sourceMappingURL=user.dtos.js.map