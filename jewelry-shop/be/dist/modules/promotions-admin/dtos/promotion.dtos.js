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
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, registerDecorator, } from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { Trim } from '../../../utils/transforms.js';
import { PROMOTION_STATUSES } from '../services/promotion-status.js';
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
function IsIsoDateTimeWithZone() {
    return (object, propertyName) => registerDecorator({
        name: 'isIsoDateTimeWithZone',
        target: object.constructor,
        propertyName,
        options: { message: 'Phải là thời gian ISO 8601 có múi giờ (ví dụ 2026-10-18T09:00:00+07:00 hoặc ...Z)' },
        validator: {
            validate: (value) => typeof value === 'string' && ISO_WITH_ZONE.test(value) && !Number.isNaN(Date.parse(value)),
        },
    });
}
export class PromotionListQueryDto extends PageQueryDto {
    q;
    status;
    productId;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], PromotionListQueryDto.prototype, "q", void 0);
__decorate([
    IsOptional(),
    IsIn(PROMOTION_STATUSES),
    __metadata("design:type", String)
], PromotionListQueryDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], PromotionListQueryDto.prototype, "productId", void 0);
export class CreatePromotionDto {
    name;
    productIds;
    discountPercent;
    startsAt;
    endsAt;
    isActive;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(150),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "name", void 0);
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(100),
    ArrayUnique(),
    IsInt({ each: true }),
    Min(1, { each: true }),
    __metadata("design:type", Array)
], CreatePromotionDto.prototype, "productIds", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(90),
    __metadata("design:type", Number)
], CreatePromotionDto.prototype, "discountPercent", void 0);
__decorate([
    IsIsoDateTimeWithZone(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "startsAt", void 0);
__decorate([
    IsIsoDateTimeWithZone(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "endsAt", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreatePromotionDto.prototype, "isActive", void 0);
export class UpdatePromotionDto {
    name;
    discountPercent;
    startsAt;
    endsAt;
    isActive;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(150),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(90),
    __metadata("design:type", Number)
], UpdatePromotionDto.prototype, "discountPercent", void 0);
__decorate([
    IsOptional(),
    IsIsoDateTimeWithZone(),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "startsAt", void 0);
__decorate([
    IsOptional(),
    IsIsoDateTimeWithZone(),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "endsAt", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdatePromotionDto.prototype, "isActive", void 0);
//# sourceMappingURL=promotion.dtos.js.map