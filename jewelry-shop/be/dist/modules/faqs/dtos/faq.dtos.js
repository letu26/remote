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
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, registerDecorator } from 'class-validator';
import { Trim } from '../../../utils/transforms.js';
const MAX_KEYWORDS = 20;
const MAX_KEYWORD_LENGTH = 50;
const MIN_KEYWORD_LENGTH = 2;
const MAX_KEYWORDS_TOTAL = 1000;
export function splitKeywords(raw) {
    return raw
        .split(',')
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0);
}
export function validateKeywords(raw) {
    if (typeof raw !== 'string')
        return 'Từ khóa phải là chuỗi';
    if (raw.length > MAX_KEYWORDS_TOTAL)
        return `Tổng độ dài từ khóa tối đa ${MAX_KEYWORDS_TOTAL} ký tự`;
    const keywords = splitKeywords(raw);
    if (keywords.length > MAX_KEYWORDS)
        return `Tối đa ${MAX_KEYWORDS} từ khóa`;
    if (keywords.some((keyword) => keyword.length < MIN_KEYWORD_LENGTH || keyword.length > MAX_KEYWORD_LENGTH)) {
        return `Mỗi từ khóa dài ${MIN_KEYWORD_LENGTH}-${MAX_KEYWORD_LENGTH} ký tự`;
    }
    return null;
}
function IsKeywordList() {
    return (object, propertyName) => registerDecorator({
        name: 'isKeywordList',
        target: object.constructor,
        propertyName,
        validator: {
            validate: (value) => validateKeywords(value) === null,
            defaultMessage: (args) => validateKeywords(args?.value) ?? 'Từ khóa không hợp lệ',
        },
    });
}
export class CreateFaqDto {
    question;
    answer;
    keywords;
    sortOrder;
    isActive;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(3),
    MaxLength(500),
    __metadata("design:type", String)
], CreateFaqDto.prototype, "question", void 0);
__decorate([
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(2000),
    __metadata("design:type", String)
], CreateFaqDto.prototype, "answer", void 0);
__decorate([
    IsOptional(),
    IsKeywordList(),
    __metadata("design:type", Object)
], CreateFaqDto.prototype, "keywords", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(-100000),
    Max(100000),
    __metadata("design:type", Number)
], CreateFaqDto.prototype, "sortOrder", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateFaqDto.prototype, "isActive", void 0);
export class UpdateFaqDto {
    question;
    answer;
    keywords;
    sortOrder;
    isActive;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(3),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateFaqDto.prototype, "question", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(2000),
    __metadata("design:type", String)
], UpdateFaqDto.prototype, "answer", void 0);
__decorate([
    IsOptional(),
    IsKeywordList(),
    __metadata("design:type", Object)
], UpdateFaqDto.prototype, "keywords", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(-100000),
    Max(100000),
    __metadata("design:type", Number)
], UpdateFaqDto.prototype, "sortOrder", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateFaqDto.prototype, "isActive", void 0);
//# sourceMappingURL=faq.dtos.js.map