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
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
export class StatsRangeQueryDto {
    from;
    to;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], StatsRangeQueryDto.prototype, "from", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], StatsRangeQueryDto.prototype, "to", void 0);
export class RevenueQueryDto extends StatsRangeQueryDto {
    granularity;
}
__decorate([
    IsOptional(),
    IsIn(['day', 'month', 'year']),
    __metadata("design:type", String)
], RevenueQueryDto.prototype, "granularity", void 0);
export class TopQueryDto extends StatsRangeQueryDto {
    limit;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(50),
    __metadata("design:type", Number)
], TopQueryDto.prototype, "limit", void 0);
export class LowStockQueryDto {
    threshold;
    limit;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(1000),
    __metadata("design:type", Number)
], LowStockQueryDto.prototype, "threshold", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(100),
    __metadata("design:type", Number)
], LowStockQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=stats.dtos.js.map