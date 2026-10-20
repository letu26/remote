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
import { IsSafeLink } from '../../../utils/link-url.util.js';
import { Trim } from '../../../utils/transforms.js';
export const MENU_PLACEMENTS = ['header', 'footer'];
export class MenuQueryDto {
    placement;
}
__decorate([
    IsOptional(),
    IsIn(MENU_PLACEMENTS),
    __metadata("design:type", String)
], MenuQueryDto.prototype, "placement", void 0);
export class CreateMenuDto {
    label;
    url;
    parentId;
    placement;
    sortOrder;
    isActive;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(100),
    __metadata("design:type", String)
], CreateMenuDto.prototype, "label", void 0);
__decorate([
    Trim(),
    IsString(),
    MaxLength(255),
    IsSafeLink(),
    __metadata("design:type", String)
], CreateMenuDto.prototype, "url", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Object)
], CreateMenuDto.prototype, "parentId", void 0);
__decorate([
    IsOptional(),
    IsIn(MENU_PLACEMENTS),
    __metadata("design:type", String)
], CreateMenuDto.prototype, "placement", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(-100000),
    Max(100000),
    __metadata("design:type", Number)
], CreateMenuDto.prototype, "sortOrder", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateMenuDto.prototype, "isActive", void 0);
export class UpdateMenuDto {
    label;
    url;
    parentId;
    placement;
    sortOrder;
    isActive;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateMenuDto.prototype, "label", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(255),
    IsSafeLink(),
    __metadata("design:type", String)
], UpdateMenuDto.prototype, "url", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Object)
], UpdateMenuDto.prototype, "parentId", void 0);
__decorate([
    IsOptional(),
    IsIn(MENU_PLACEMENTS),
    __metadata("design:type", String)
], UpdateMenuDto.prototype, "placement", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(-100000),
    Max(100000),
    __metadata("design:type", Number)
], UpdateMenuDto.prototype, "sortOrder", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateMenuDto.prototype, "isActive", void 0);
//# sourceMappingURL=menu.dtos.js.map