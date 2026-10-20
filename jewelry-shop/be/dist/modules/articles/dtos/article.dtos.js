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
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { IsHttpsUrl } from '../../../utils/link-url.util.js';
import { PageQueryDto } from '../../../utils/pagination.js';
import { SLUG_PATTERN } from '../../../utils/slug.util.js';
import { ToBoolean, Trim } from '../../../utils/transforms.js';
const MAX_CONTENT = 100_000;
const StripNul = () => Transform(({ value }) => (typeof value === 'string' ? value.split(String.fromCharCode(0)).join('') : value));
export class ArticleListQueryDto extends PageQueryDto {
    q;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], ArticleListQueryDto.prototype, "q", void 0);
export class AdminArticleListQueryDto extends ArticleListQueryDto {
    published;
}
__decorate([
    IsOptional(),
    ToBoolean(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], AdminArticleListQueryDto.prototype, "published", void 0);
export class CreateArticleDto {
    title;
    slug;
    summary;
    content;
    thumbnailUrl;
    thumbnailPublicId;
    isPublished;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(3),
    MaxLength(255),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    Trim(),
    Matches(SLUG_PATTERN, { message: 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang' }),
    MaxLength(280),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "slug", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", Object)
], CreateArticleDto.prototype, "summary", void 0);
__decorate([
    StripNul(),
    IsString(),
    MinLength(1),
    MaxLength(MAX_CONTENT),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "content", void 0);
__decorate([
    IsOptional(),
    ValidateIf((_, value) => value !== ''),
    IsString(),
    MaxLength(500),
    IsHttpsUrl(),
    __metadata("design:type", Object)
], CreateArticleDto.prototype, "thumbnailUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", Object)
], CreateArticleDto.prototype, "thumbnailPublicId", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateArticleDto.prototype, "isPublished", void 0);
export class UpdateArticleDto {
    title;
    slug;
    summary;
    content;
    thumbnailUrl;
    thumbnailPublicId;
    isPublished;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(3),
    MaxLength(255),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    Trim(),
    Matches(SLUG_PATTERN, { message: 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang' }),
    MaxLength(280),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "slug", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", Object)
], UpdateArticleDto.prototype, "summary", void 0);
__decorate([
    IsOptional(),
    StripNul(),
    IsString(),
    MinLength(1),
    MaxLength(MAX_CONTENT),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "content", void 0);
__decorate([
    IsOptional(),
    ValidateIf((_, value) => value !== ''),
    IsString(),
    MaxLength(500),
    IsHttpsUrl(),
    __metadata("design:type", Object)
], UpdateArticleDto.prototype, "thumbnailUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", Object)
], UpdateArticleDto.prototype, "thumbnailPublicId", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateArticleDto.prototype, "isPublished", void 0);
//# sourceMappingURL=article.dtos.js.map