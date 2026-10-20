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
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, Res, UseGuards, } from '@nestjs/common';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import { PageQueryDto } from '../../../utils/pagination.js';
import { AddWishlistDto } from '../dtos/wishlist.dtos.js';
import { WishlistService } from '../services/wishlist.service.js';
let WishlistController = class WishlistController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(user, query) {
        return this.service.list(user.id, query);
    }
    ids(user) {
        return this.service.listIds(user.id);
    }
    async add(user, dto, res) {
        const { productId, created } = await this.service.add(user.id, dto.productId);
        res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
        return { productId };
    }
    remove(user, productId) {
        return this.service.remove(user.id, productId);
    }
};
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, PageQueryDto]),
    __metadata("design:returntype", void 0)
], WishlistController.prototype, "list", null);
__decorate([
    Get('ids'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WishlistController.prototype, "ids", null);
__decorate([
    Post(),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __param(2, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AddWishlistDto, Object]),
    __metadata("design:returntype", Promise)
], WishlistController.prototype, "add", null);
__decorate([
    Delete(':productId'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, CurrentUser()),
    __param(1, Param('productId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], WishlistController.prototype, "remove", null);
WishlistController = __decorate([
    Controller('wishlist'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [WishlistService])
], WishlistController);
export { WishlistController };
//# sourceMappingURL=wishlist.controller.js.map