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
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';
export const MAX_LINE_QUANTITY = 10;
export class AddCartItemDto {
    variantId;
    quantity;
}
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], AddCartItemDto.prototype, "variantId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(MAX_LINE_QUANTITY),
    __metadata("design:type", Number)
], AddCartItemDto.prototype, "quantity", void 0);
export class UpdateCartItemDto {
    quantity;
}
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(MAX_LINE_QUANTITY),
    __metadata("design:type", Number)
], UpdateCartItemDto.prototype, "quantity", void 0);
export class RemoveCartItemsDto {
    itemIds;
}
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(50),
    IsInt({ each: true }),
    Min(1, { each: true }),
    __metadata("design:type", Array)
], RemoveCartItemsDto.prototype, "itemIds", void 0);
//# sourceMappingURL=cart.dtos.js.map