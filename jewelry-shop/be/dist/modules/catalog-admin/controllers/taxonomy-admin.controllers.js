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
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CreateCategoryDto, CreateCollectionDto, CreateNamedLookupDto, UpdateCategoryDto, UpdateCollectionDto, UpdateNamedLookupDto, } from '../dtos/taxonomy-admin.dtos.js';
import { CategoryAdminService } from '../services/category-admin.service.js';
import { CollectionAdminService } from '../services/collection-admin.service.js';
import { LookupAdminService } from '../services/lookup-admin.service.js';
let CategoryAdminController = class CategoryAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    list() {
        return this.service.list();
    }
    create(dto) {
        return this.service.create(dto);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CategoryAdminController.prototype, "list", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateCategoryDto]),
    __metadata("design:returntype", void 0)
], CategoryAdminController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateCategoryDto]),
    __metadata("design:returntype", void 0)
], CategoryAdminController.prototype, "update", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CategoryAdminController.prototype, "remove", null);
CategoryAdminController = __decorate([
    Controller('admin/categories'),
    AdminOnly(),
    __metadata("design:paramtypes", [CategoryAdminService])
], CategoryAdminController);
export { CategoryAdminController };
let MaterialAdminController = class MaterialAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    list() {
        return this.service.list('materials');
    }
    create(dto) {
        return this.service.create('materials', dto);
    }
    update(id, dto) {
        return this.service.update('materials', id, dto);
    }
    remove(id) {
        return this.service.remove('materials', id);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MaterialAdminController.prototype, "list", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateNamedLookupDto]),
    __metadata("design:returntype", void 0)
], MaterialAdminController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateNamedLookupDto]),
    __metadata("design:returntype", void 0)
], MaterialAdminController.prototype, "update", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MaterialAdminController.prototype, "remove", null);
MaterialAdminController = __decorate([
    Controller('admin/materials'),
    AdminOnly(),
    __metadata("design:paramtypes", [LookupAdminService])
], MaterialAdminController);
export { MaterialAdminController };
let GemstoneAdminController = class GemstoneAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    list() {
        return this.service.list('gemstones');
    }
    create(dto) {
        return this.service.create('gemstones', dto);
    }
    update(id, dto) {
        return this.service.update('gemstones', id, dto);
    }
    remove(id) {
        return this.service.remove('gemstones', id);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GemstoneAdminController.prototype, "list", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateNamedLookupDto]),
    __metadata("design:returntype", void 0)
], GemstoneAdminController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateNamedLookupDto]),
    __metadata("design:returntype", void 0)
], GemstoneAdminController.prototype, "update", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], GemstoneAdminController.prototype, "remove", null);
GemstoneAdminController = __decorate([
    Controller('admin/gemstones'),
    AdminOnly(),
    __metadata("design:paramtypes", [LookupAdminService])
], GemstoneAdminController);
export { GemstoneAdminController };
let CollectionAdminController = class CollectionAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    list() {
        return this.service.list();
    }
    create(dto) {
        return this.service.create(dto);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CollectionAdminController.prototype, "list", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateCollectionDto]),
    __metadata("design:returntype", void 0)
], CollectionAdminController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateCollectionDto]),
    __metadata("design:returntype", void 0)
], CollectionAdminController.prototype, "update", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CollectionAdminController.prototype, "remove", null);
CollectionAdminController = __decorate([
    Controller('admin/collections'),
    AdminOnly(),
    __metadata("design:paramtypes", [CollectionAdminService])
], CollectionAdminController);
export { CollectionAdminController };
//# sourceMappingURL=taxonomy-admin.controllers.js.map