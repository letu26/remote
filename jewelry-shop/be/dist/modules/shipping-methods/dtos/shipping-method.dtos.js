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
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Trim } from '../../../utils/transforms.js';
export class CreateShippingMethodDto {
    name;
    description;
    fee;
    isActive;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(100),
    __metadata("design:type", String)
], CreateShippingMethodDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", Object)
], CreateShippingMethodDto.prototype, "description", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100_000_000),
    __metadata("design:type", Number)
], CreateShippingMethodDto.prototype, "fee", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateShippingMethodDto.prototype, "isActive", void 0);
export class UpdateShippingMethodDto {
    name;
    description;
    fee;
    isActive;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MinLength(2),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateShippingMethodDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", Object)
], UpdateShippingMethodDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(100_000_000),
    __metadata("design:type", Number)
], UpdateShippingMethodDto.prototype, "fee", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateShippingMethodDto.prototype, "isActive", void 0);
//# sourceMappingURL=shipping-method.dtos.js.map