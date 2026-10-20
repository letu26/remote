var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, Get } from '@nestjs/common';
import { CatalogService } from '../services/catalog.service.js';
let CatalogController = class CatalogController {
    catalog;
    constructor(catalog) {
        this.catalog = catalog;
    }
    categories() {
        return this.catalog.getCategoryTree();
    }
    materials() {
        return this.catalog.getMaterials();
    }
    gemstones() {
        return this.catalog.getGemstones();
    }
    collections() {
        return this.catalog.getCollections();
    }
};
__decorate([
    Get('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "categories", null);
__decorate([
    Get('materials'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "materials", null);
__decorate([
    Get('gemstones'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "gemstones", null);
__decorate([
    Get('collections'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "collections", null);
CatalogController = __decorate([
    Controller(),
    __metadata("design:paramtypes", [CatalogService])
], CatalogController);
export { CatalogController };
//# sourceMappingURL=catalog.controller.js.map