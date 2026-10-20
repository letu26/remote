var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested, } from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { SLUG_PATTERN } from '../../../utils/slug.util.js';
import { ToBoolean, Trim } from '../../../utils/transforms.js';
import { TargetGroup } from '../../catalog/models/product.entity.js';
const MAX_MONEY = 1_000_000_000_000;
const Money = (min) => applyDecorators(Type(() => Number), IsInt(), Min(min), Max(MAX_MONEY));
const OptionalText = (max) => applyDecorators(IsOptional(), IsString(), MaxLength(max));
const OptionalRef = () => applyDecorators(IsOptional(), Type(() => Number), IsInt(), Min(1));
export class ProductGemstoneInputDto {
    gemstoneId;
    quantity;
    carat;
    color;
    clarity;
    cut;
}
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ProductGemstoneInputDto.prototype, "gemstoneId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(1000),
    __metadata("design:type", Number)
], ProductGemstoneInputDto.prototype, "quantity", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber({ maxDecimalPlaces: 3 }),
    Min(0),
    Max(99999),
    __metadata("design:type", Object)
], ProductGemstoneInputDto.prototype, "carat", void 0);
__decorate([
    OptionalText(50),
    __metadata("design:type", Object)
], ProductGemstoneInputDto.prototype, "color", void 0);
__decorate([
    OptionalText(50),
    __metadata("design:type", Object)
], ProductGemstoneInputDto.prototype, "clarity", void 0);
__decorate([
    OptionalText(50),
    __metadata("design:type", Object)
], ProductGemstoneInputDto.prototype, "cut", void 0);
export class ProductVariantInputDto {
    id;
    sku;
    size;
    stock;
    isActive;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ProductVariantInputDto.prototype, "id", void 0);
__decorate([
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(60),
    __metadata("design:type", String)
], ProductVariantInputDto.prototype, "sku", void 0);
__decorate([
    Trim(),
    IsString(),
    MaxLength(30),
    __metadata("design:type", String)
], ProductVariantInputDto.prototype, "size", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(10_000_000),
    __metadata("design:type", Number)
], ProductVariantInputDto.prototype, "stock", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], ProductVariantInputDto.prototype, "isActive", void 0);
export class CreateProductDto {
    code;
    name;
    slug;
    description;
    categoryId;
    materialId;
    collectionId;
    targetGroup;
    weight;
    costPrice;
    price;
    warrantyInfo;
    certificate;
    isFeatured;
    isActive;
    gemstones;
    variants;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(50),
    __metadata("design:type", String)
], CreateProductDto.prototype, "code", void 0);
__decorate([
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(200),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    Trim(),
    Matches(SLUG_PATTERN, { message: 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang' }),
    MaxLength(220),
    __metadata("design:type", String)
], CreateProductDto.prototype, "slug", void 0);
__decorate([
    OptionalText(20000),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "categoryId", void 0);
__decorate([
    OptionalRef(),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "materialId", void 0);
__decorate([
    OptionalRef(),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "collectionId", void 0);
__decorate([
    IsOptional(),
    IsEnum(TargetGroup),
    __metadata("design:type", String)
], CreateProductDto.prototype, "targetGroup", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber({ maxDecimalPlaces: 3 }),
    Min(0),
    Max(9_999_999),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "weight", void 0);
__decorate([
    IsOptional(),
    Money(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "costPrice", void 0);
__decorate([
    Money(1),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "price", void 0);
__decorate([
    OptionalText(5000),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "warrantyInfo", void 0);
__decorate([
    OptionalText(255),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "certificate", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isFeatured", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMaxSize(20),
    ValidateNested({ each: true }),
    Type(() => ProductGemstoneInputDto),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "gemstones", void 0);
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(100),
    ValidateNested({ each: true }),
    Type(() => ProductVariantInputDto),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "variants", void 0);
export class UpdateProductDto {
    code;
    name;
    slug;
    description;
    categoryId;
    materialId;
    collectionId;
    targetGroup;
    weight;
    costPrice;
    price;
    warrantyInfo;
    certificate;
    isFeatured;
    isActive;
    gemstones;
    variants;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    Trim(),
    Matches(SLUG_PATTERN, { message: 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang' }),
    MaxLength(220),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "slug", void 0);
__decorate([
    OptionalText(20000),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "categoryId", void 0);
__decorate([
    OptionalRef(),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "materialId", void 0);
__decorate([
    OptionalRef(),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "collectionId", void 0);
__decorate([
    IsOptional(),
    IsEnum(TargetGroup),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "targetGroup", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber({ maxDecimalPlaces: 3 }),
    Min(0),
    Max(9_999_999),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "weight", void 0);
__decorate([
    IsOptional(),
    Money(0),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "costPrice", void 0);
__decorate([
    IsOptional(),
    Money(1),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "price", void 0);
__decorate([
    OptionalText(5000),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "warrantyInfo", void 0);
__decorate([
    OptionalText(255),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "certificate", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "isFeatured", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMaxSize(20),
    ValidateNested({ each: true }),
    Type(() => ProductGemstoneInputDto),
    __metadata("design:type", Array)
], UpdateProductDto.prototype, "gemstones", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(100),
    ValidateNested({ each: true }),
    Type(() => ProductVariantInputDto),
    __metadata("design:type", Array)
], UpdateProductDto.prototype, "variants", void 0);
export class AdminProductListQueryDto extends PageQueryDto {
    q;
    categoryId;
    isActive;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], AdminProductListQueryDto.prototype, "q", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], AdminProductListQueryDto.prototype, "categoryId", void 0);
__decorate([
    IsOptional(),
    ToBoolean(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], AdminProductListQueryDto.prototype, "isActive", void 0);
export class StockChangeDto {
    delta;
    set;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(-10_000_000),
    Max(10_000_000),
    __metadata("design:type", Number)
], StockChangeDto.prototype, "delta", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(10_000_000),
    __metadata("design:type", Number)
], StockChangeDto.prototype, "set", void 0);
export class ReorderImagesDto {
    imageIds;
}
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(10),
    IsInt({ each: true }),
    Min(1, { each: true }),
    __metadata("design:type", Array)
], ReorderImagesDto.prototype, "imageIds", void 0);
export class UpdateImageDto {
    isPrimary;
    sortOrder;
}
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateImageDto.prototype, "isPrimary", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(1000),
    __metadata("design:type", Number)
], UpdateImageDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=product-admin.dtos.js.map