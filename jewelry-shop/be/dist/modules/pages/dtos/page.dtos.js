var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { SLUG_PATTERN } from '../../../utils/slug.util.js';
import { Trim } from '../../../utils/transforms.js';
const MAX_CONTENT = 100_000;
const SLUG_MESSAGE = 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang';
const StripNul = () => Transform(({ value }) => (typeof value === 'string' ? value.split(String.fromCharCode(0)).join('') : value));
export class CreatePageDto {
    slug;
    title;
    content;
    isActive;
}
__decorate([
    Trim(),
    Matches(SLUG_PATTERN, { message: SLUG_MESSAGE }),
    MinLength(2),
    MaxLength(120),
    __metadata("design:type", String)
], CreatePageDto.prototype, "slug", void 0);
__decorate([
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(255),
    __metadata("design:type", String)
], CreatePageDto.prototype, "title", void 0);
__decorate([
    StripNul(),
    IsString(),
    MinLength(1),
    MaxLength(MAX_CONTENT),
    __metadata("design:type", String)
], CreatePageDto.prototype, "content", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreatePageDto.prototype, "isActive", void 0);
export class UpdatePageDto {
    slug;
    title;
    content;
    isActive;
}
__decorate([
    IsOptional(),
    Trim(),
    Matches(SLUG_PATTERN, { message: SLUG_MESSAGE }),
    MinLength(2),
    MaxLength(120),
    __metadata("design:type", String)
], UpdatePageDto.prototype, "slug", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(255),
    __metadata("design:type", String)
], UpdatePageDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    StripNul(),
    IsString(),
    MinLength(1),
    MaxLength(MAX_CONTENT),
    __metadata("design:type", String)
], UpdatePageDto.prototype, "content", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdatePageDto.prototype, "isActive", void 0);
//# sourceMappingURL=page.dtos.js.map