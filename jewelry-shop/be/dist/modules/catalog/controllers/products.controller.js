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
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductListQueryDto } from '../dtos/product-query.dto.js';
import { ProductCatalogService } from '../services/product-catalog.service.js';
let ProductsController = class ProductsController {
    products;
    constructor(products) {
        this.products = products;
    }
    list(query) {
        return this.products.list(query);
    }
    detail(slug) {
        return this.products.getBySlug(slug);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ProductListQueryDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "list", null);
__decorate([
    Get(':slug'),
    __param(0, Param('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "detail", null);
ProductsController = __decorate([
    Controller('products'),
    __metadata("design:paramtypes", [ProductCatalogService])
], ProductsController);
export { ProductsController };
//# sourceMappingURL=products.controller.js.map