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
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Query, UploadedFiles, UseInterceptors, } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { AdminProductListQueryDto, CreateProductDto, ReorderImagesDto, StockChangeDto, UpdateImageDto, UpdateProductDto, } from '../dtos/product-admin.dtos.js';
import { ImageUploadInterceptor } from '../interceptors/image-upload.interceptor.js';
import { ProductAdminService } from '../services/product-admin.service.js';
import { ProductImageService } from '../services/product-image.service.js';
let ProductAdminController = class ProductAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(query) {
        return this.service.list(query);
    }
    detail(id) {
        return this.service.getDetail(id);
    }
    create(dto) {
        return this.service.create(dto);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    changeStock(id, variantId, dto) {
        return this.service.changeStock(id, variantId, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AdminProductListQueryDto]),
    __metadata("design:returntype", void 0)
], ProductAdminController.prototype, "list", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductAdminController.prototype, "detail", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateProductDto]),
    __metadata("design:returntype", void 0)
], ProductAdminController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateProductDto]),
    __metadata("design:returntype", void 0)
], ProductAdminController.prototype, "update", null);
__decorate([
    Patch(':id/variants/:variantId/stock'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Param('variantId', ParseIntPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, StockChangeDto]),
    __metadata("design:returntype", void 0)
], ProductAdminController.prototype, "changeStock", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductAdminController.prototype, "remove", null);
ProductAdminController = __decorate([
    Controller('admin/products'),
    AdminOnly(),
    __metadata("design:paramtypes", [ProductAdminService])
], ProductAdminController);
export { ProductAdminController };
let ProductImageAdminController = class ProductImageAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    upload(id, files) {
        return this.service.upload(id, files);
    }
    reorder(id, dto) {
        return this.service.reorder(id, dto.imageIds);
    }
    update(id, imageId, dto) {
        return this.service.update(id, imageId, dto);
    }
    remove(id, imageId) {
        return this.service.remove(id, imageId);
    }
};
__decorate([
    Post(),
    UseInterceptors(ImageUploadInterceptor),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, UploadedFiles()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ProductImageAdminController.prototype, "upload", null);
__decorate([
    Put('order'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ReorderImagesDto]),
    __metadata("design:returntype", void 0)
], ProductImageAdminController.prototype, "reorder", null);
__decorate([
    Patch(':imageId'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Param('imageId', ParseIntPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, UpdateImageDto]),
    __metadata("design:returntype", void 0)
], ProductImageAdminController.prototype, "update", null);
__decorate([
    Delete(':imageId'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Param('imageId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ProductImageAdminController.prototype, "remove", null);
ProductImageAdminController = __decorate([
    Controller('admin/products/:id/images'),
    AdminOnly(),
    __metadata("design:paramtypes", [ProductImageService])
], ProductImageAdminController);
export { ProductImageAdminController };
//# sourceMappingURL=product-admin.controllers.js.map