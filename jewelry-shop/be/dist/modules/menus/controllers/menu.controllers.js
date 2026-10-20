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
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CreateMenuDto, MenuQueryDto, UpdateMenuDto } from '../dtos/menu.dtos.js';
import { MenuService } from '../services/menu.service.js';
let MenuController = class MenuController {
    service;
    constructor(service) {
        this.service = service;
    }
    tree(query) {
        return this.service.getTree(query.placement);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MenuQueryDto]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "tree", null);
MenuController = __decorate([
    Controller('menus'),
    __metadata("design:paramtypes", [MenuService])
], MenuController);
export { MenuController };
let MenuAdminController = class MenuAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    list() {
        return this.service.listAll();
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
], MenuAdminController.prototype, "list", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateMenuDto]),
    __metadata("design:returntype", void 0)
], MenuAdminController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateMenuDto]),
    __metadata("design:returntype", void 0)
], MenuAdminController.prototype, "update", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MenuAdminController.prototype, "remove", null);
MenuAdminController = __decorate([
    Controller('admin/menus'),
    AdminOnly(),
    __metadata("design:paramtypes", [MenuService])
], MenuAdminController);
export { MenuAdminController };
//# sourceMappingURL=menu.controllers.js.map