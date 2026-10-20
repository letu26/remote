var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards, } from '@nestjs/common';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import { AddCartItemDto, RemoveCartItemsDto, UpdateCartItemDto } from '../dtos/cart.dtos.js';
import { CartService } from '../services/cart.service.js';
let CartController = class CartController {
    service;
    constructor(service) {
        this.service = service;
    }
    get(user) {
        return this.service.getCart(user.id);
    }
    summary(user) {
        return this.service.summary(user.id);
    }
    add(user, dto) {
        return this.service.addItem(user.id, dto.variantId, dto.quantity);
    }
    removeMany(user, dto) {
        return this.service.removeItems(user.id, dto.itemIds);
    }
    update(user, itemId, dto) {
        return this.service.setQuantity(user.id, itemId, dto.quantity);
    }
    remove(user, itemId) {
        return this.service.removeItem(user.id, itemId);
    }
    clear(user) {
        return this.service.clear(user.id);
    }
};
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CartController.prototype, "get", null);
__decorate([
    Get('summary'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CartController.prototype, "summary", null);
__decorate([
    Post('items'),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AddCartItemDto]),
    __metadata("design:returntype", void 0)
], CartController.prototype, "add", null);
__decorate([
    Post('items/remove'),
    HttpCode(HttpStatus.OK),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RemoveCartItemsDto]),
    __metadata("design:returntype", void 0)
], CartController.prototype, "removeMany", null);
__decorate([
    Patch('items/:itemId'),
    __param(0, CurrentUser()),
    __param(1, Param('itemId', ParseIntPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, UpdateCartItemDto]),
    __metadata("design:returntype", void 0)
], CartController.prototype, "update", null);
__decorate([
    Delete('items/:itemId'),
    __param(0, CurrentUser()),
    __param(1, Param('itemId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], CartController.prototype, "remove", null);
__decorate([
    Delete(),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CartController.prototype, "clear", null);
CartController = __decorate([
    Controller('cart'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [CartService])
], CartController);
export { CartController };
//# sourceMappingURL=cart.controller.js.map