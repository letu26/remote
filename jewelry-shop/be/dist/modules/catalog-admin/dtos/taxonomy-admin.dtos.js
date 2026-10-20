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
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { SLUG_PATTERN } from '../../../utils/slug.util.js';
import { Trim } from '../../../utils/transforms.js';
const SLUG_MESSAGE = 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang';
export class CreateCategoryDto {
    name;
    slug;
    parentId;
    sortOrder;
    isActive;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(100),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    Trim(),
    Matches(SLUG_PATTERN, { message: SLUG_MESSAGE }),
    MaxLength(120),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "slug", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Object)
], CreateCategoryDto.prototype, "parentId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    __metadata("design:type", Number)
], CreateCategoryDto.prototype, "sortOrder", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateCategoryDto.prototype, "isActive", void 0);
export class UpdateCategoryDto {
    name;
    slug;
    parentId;
    sortOrder;
    isActive;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    Trim(),
    Matches(SLUG_PATTERN, { message: SLUG_MESSAGE }),
    MaxLength(120),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "slug", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Object)
], UpdateCategoryDto.prototype, "parentId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    __metadata("design:type", Number)
], UpdateCategoryDto.prototype, "sortOrder", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateCategoryDto.prototype, "isActive", void 0);
export class CreateNamedLookupDto {
    name;
    isActive;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(100),
    __metadata("design:type", String)
], CreateNamedLookupDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateNamedLookupDto.prototype, "isActive", void 0);
export class UpdateNamedLookupDto {
    name;
    isActive;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateNamedLookupDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateNamedLookupDto.prototype, "isActive", void 0);
export class CreateCollectionDto {
    name;
    slug;
    description;
    bannerUrl;
    isActive;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(150),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    Trim(),
    Matches(SLUG_PATTERN, { message: SLUG_MESSAGE }),
    MaxLength(170),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "slug", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(5000),
    __metadata("design:type", Object)
], CreateCollectionDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsUrl({ require_protocol: true, protocols: ['http', 'https'] }),
    MaxLength(500),
    __metadata("design:type", Object)
], CreateCollectionDto.prototype, "bannerUrl", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateCollectionDto.prototype, "isActive", void 0);
export class UpdateCollectionDto {
    name;
    slug;
    description;
    bannerUrl;
    isActive;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(150),
    __metadata("design:type", String)
], UpdateCollectionDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    Trim(),
    Matches(SLUG_PATTERN, { message: SLUG_MESSAGE }),
    MaxLength(170),
    __metadata("design:type", String)
], UpdateCollectionDto.prototype, "slug", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(5000),
    __metadata("design:type", Object)
], UpdateCollectionDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsUrl({ require_protocol: true, protocols: ['http', 'https'] }),
    MaxLength(500),
    __metadata("design:type", Object)
], UpdateCollectionDto.prototype, "bannerUrl", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateCollectionDto.prototype, "isActive", void 0);
//# sourceMappingURL=taxonomy-admin.dtos.js.map