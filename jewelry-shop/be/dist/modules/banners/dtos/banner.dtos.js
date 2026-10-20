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
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { IsHttpsUrl, IsSafeLink } from '../../../utils/link-url.util.js';
import { Trim } from '../../../utils/transforms.js';
export const BANNER_POSITIONS = ['home_hero', 'home_promo'];
export class BannerQueryDto {
    position;
}
__decorate([
    IsOptional(),
    IsIn(BANNER_POSITIONS),
    __metadata("design:type", String)
], BannerQueryDto.prototype, "position", void 0);
export class CreateBannerDto {
    title;
    imageUrl;
    imagePublicId;
    linkUrl;
    position;
    sortOrder;
    isActive;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(150),
    __metadata("design:type", String)
], CreateBannerDto.prototype, "title", void 0);
__decorate([
    IsString(),
    MaxLength(500),
    IsHttpsUrl(),
    __metadata("design:type", String)
], CreateBannerDto.prototype, "imageUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", Object)
], CreateBannerDto.prototype, "imagePublicId", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(500),
    IsSafeLink(),
    __metadata("design:type", Object)
], CreateBannerDto.prototype, "linkUrl", void 0);
__decorate([
    IsIn(BANNER_POSITIONS),
    __metadata("design:type", String)
], CreateBannerDto.prototype, "position", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(-100000),
    Max(100000),
    __metadata("design:type", Number)
], CreateBannerDto.prototype, "sortOrder", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateBannerDto.prototype, "isActive", void 0);
export class UpdateBannerDto {
    title;
    imageUrl;
    imagePublicId;
    linkUrl;
    position;
    sortOrder;
    isActive;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(150),
    __metadata("design:type", String)
], UpdateBannerDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    IsHttpsUrl(),
    __metadata("design:type", String)
], UpdateBannerDto.prototype, "imageUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", Object)
], UpdateBannerDto.prototype, "imagePublicId", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(500),
    IsSafeLink(),
    __metadata("design:type", Object)
], UpdateBannerDto.prototype, "linkUrl", void 0);
__decorate([
    IsOptional(),
    IsIn(BANNER_POSITIONS),
    __metadata("design:type", String)
], UpdateBannerDto.prototype, "position", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(-100000),
    Max(100000),
    __metadata("design:type", Number)
], UpdateBannerDto.prototype, "sortOrder", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateBannerDto.prototype, "isActive", void 0);
//# sourceMappingURL=banner.dtos.js.map