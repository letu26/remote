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
import { IsInt, IsOptional, Min } from 'class-validator';
export class PageQueryDto {
    page;
    pageSize;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], PageQueryDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], PageQueryDto.prototype, "pageSize", void 0);
export function resolvePage(query, defaultSize, maxSize) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? defaultSize, maxSize);
    return { page, pageSize, offset: (page - 1) * pageSize };
}
export function toPage(items, total, request) {
    return {
        items,
        page: request.page,
        pageSize: request.pageSize,
        total,
        totalPages: Math.ceil(total / request.pageSize),
    };
}
//# sourceMappingURL=pagination.js.map