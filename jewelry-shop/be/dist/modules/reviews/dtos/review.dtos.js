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
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { ToBoolean, Trim } from '../../../utils/transforms.js';
export const MAX_COMMENT_LENGTH = 1000;
export class CreateReviewDto {
    rating;
    comment;
}
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(5),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "rating", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(MAX_COMMENT_LENGTH),
    __metadata("design:type", Object)
], CreateReviewDto.prototype, "comment", void 0);
export class UpdateReviewDto {
    rating;
    comment;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(5),
    __metadata("design:type", Number)
], UpdateReviewDto.prototype, "rating", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(MAX_COMMENT_LENGTH),
    __metadata("design:type", Object)
], UpdateReviewDto.prototype, "comment", void 0);
export class ReviewListQueryDto extends PageQueryDto {
    rating;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(5),
    __metadata("design:type", Number)
], ReviewListQueryDto.prototype, "rating", void 0);
export class AdminReviewListQueryDto extends PageQueryDto {
    q;
    rating;
    hidden;
    productId;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], AdminReviewListQueryDto.prototype, "q", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(5),
    __metadata("design:type", Number)
], AdminReviewListQueryDto.prototype, "rating", void 0);
__decorate([
    IsOptional(),
    ToBoolean(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], AdminReviewListQueryDto.prototype, "hidden", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], AdminReviewListQueryDto.prototype, "productId", void 0);
export class UpdateReviewVisibilityDto {
    isHidden;
}
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateReviewVisibilityDto.prototype, "isHidden", void 0);
//# sourceMappingURL=review.dtos.js.map