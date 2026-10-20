var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { Trim } from '../../../utils/transforms.js';
import { PHONE_REGEX } from '../../users/dtos/user.dtos.js';
export class CreateAddressDto {
    receiverName;
    receiverPhone;
    provinceId;
    wardId;
    detail;
    isDefault;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(100),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "receiverName", void 0);
__decorate([
    Trim(),
    Matches(PHONE_REGEX, { message: 'Số điện thoại không hợp lệ' }),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "receiverPhone", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], CreateAddressDto.prototype, "provinceId", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], CreateAddressDto.prototype, "wardId", void 0);
__decorate([
    Trim(),
    IsString(),
    MinLength(5),
    MaxLength(255),
    __metadata("design:type", String)
], CreateAddressDto.prototype, "detail", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateAddressDto.prototype, "isDefault", void 0);
export class UpdateAddressDto {
    receiverName;
    receiverPhone;
    provinceId;
    wardId;
    detail;
    isDefault;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "receiverName", void 0);
__decorate([
    IsOptional(),
    Trim(),
    Matches(PHONE_REGEX, { message: 'Số điện thoại không hợp lệ' }),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "receiverPhone", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], UpdateAddressDto.prototype, "provinceId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], UpdateAddressDto.prototype, "wardId", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(5),
    MaxLength(255),
    __metadata("design:type", String)
], UpdateAddressDto.prototype, "detail", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateAddressDto.prototype, "isDefault", void 0);
//# sourceMappingURL=address.dtos.js.map