var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { ToBoolean, Trim } from '../../../utils/transforms.js';
import { TargetGroup } from '../models/product.entity.js';
export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'bestseller', 'rating'];
export class ProductListQueryDto extends PageQueryDto {
    q;
    category;
    collection;
    material;
    gemstone;
    targetGroup;
    minPrice;
    maxPrice;
    inStock;
    onSale;
    featured;
    sort;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], ProductListQueryDto.prototype, "q", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    __metadata("design:type", String)
], ProductListQueryDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(170),
    __metadata("design:type", String)
], ProductListQueryDto.prototype, "collection", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ProductListQueryDto.prototype, "material", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => typeof value === 'string' ? value.split(',').filter((part) => part.trim() !== '').map(Number) : value),
    ArrayMaxSize(20),
    IsInt({ each: true }),
    Min(1, { each: true }),
    __metadata("design:type", Array)
], ProductListQueryDto.prototype, "gemstone", void 0);
__decorate([
    IsOptional(),
    IsEnum(TargetGroup),
    __metadata("design:type", String)
], ProductListQueryDto.prototype, "targetGroup", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(1_000_000_000_000),
    __metadata("design:type", Number)
], ProductListQueryDto.prototype, "minPrice", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(1_000_000_000_000),
    __metadata("design:type", Number)
], ProductListQueryDto.prototype, "maxPrice", void 0);
__decorate([
    IsOptional(),
    ToBoolean(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], ProductListQueryDto.prototype, "inStock", void 0);
__decorate([
    IsOptional(),
    ToBoolean(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], ProductListQueryDto.prototype, "onSale", void 0);
__decorate([
    IsOptional(),
    ToBoolean(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], ProductListQueryDto.prototype, "featured", void 0);
__decorate([
    IsOptional(),
    IsIn(PRODUCT_SORTS),
    __metadata("design:type", Object)
], ProductListQueryDto.prototype, "sort", void 0);
//# sourceMappingURL=product-query.dto.js.map