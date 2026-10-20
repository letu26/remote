var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEmail, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { IsHttpsUrl } from '../../../utils/link-url.util.js';
import { Trim } from '../../../utils/transforms.js';
const SOCIAL_MESSAGE = 'Chỉ chấp nhận để trống hoặc URL https://';
function Social() {
    return function (target, propertyKey) {
        Trim()(target, propertyKey);
        IsString()(target, propertyKey);
        MaxLength(255)(target, propertyKey);
        ValidateIf((_, value) => value !== '')(target, propertyKey);
        IsHttpsUrl({ message: SOCIAL_MESSAGE })(target, propertyKey);
    };
}
export class SiteInfoDto {
    brandName;
    slogan;
    hotline;
    email;
    address;
    openingHours;
    facebook;
    zalo;
    instagram;
    tiktok;
    footerText;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(60),
    __metadata("design:type", String)
], SiteInfoDto.prototype, "brandName", void 0);
__decorate([
    Trim(),
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], SiteInfoDto.prototype, "slogan", void 0);
__decorate([
    Trim(),
    IsString(),
    MaxLength(30),
    __metadata("design:type", String)
], SiteInfoDto.prototype, "hotline", void 0);
__decorate([
    Trim(),
    IsString(),
    MaxLength(150),
    ValidateIf((_, value) => value !== ''),
    IsEmail({}, { message: 'Email không hợp lệ' }),
    __metadata("design:type", String)
], SiteInfoDto.prototype, "email", void 0);
__decorate([
    Trim(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], SiteInfoDto.prototype, "address", void 0);
__decorate([
    Trim(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], SiteInfoDto.prototype, "openingHours", void 0);
__decorate([
    Social(),
    __metadata("design:type", String)
], SiteInfoDto.prototype, "facebook", void 0);
__decorate([
    Social(),
    __metadata("design:type", String)
], SiteInfoDto.prototype, "zalo", void 0);
__decorate([
    Social(),
    __metadata("design:type", String)
], SiteInfoDto.prototype, "instagram", void 0);
__decorate([
    Social(),
    __metadata("design:type", String)
], SiteInfoDto.prototype, "tiktok", void 0);
__decorate([
    Trim(),
    IsString(),
    MaxLength(300),
    __metadata("design:type", String)
], SiteInfoDto.prototype, "footerText", void 0);
export const SITE_INFO_DEFAULTS = {
    brandName: 'Lumière Gems',
    slogan: 'Trang sức đá quý tinh tế',
    hotline: '1900 0000',
    email: 'lienhe@example.com',
    address: 'Số 1, Phố Mẫu, Hà Nội',
    openingHours: '08:30 - 21:00 mỗi ngày',
    facebook: '',
    zalo: '',
    instagram: '',
    tiktok: '',
    footerText: '',
};
export const SITE_INFO_FIELDS = Object.keys(SITE_INFO_DEFAULTS);
//# sourceMappingURL=site-info.dtos.js.map