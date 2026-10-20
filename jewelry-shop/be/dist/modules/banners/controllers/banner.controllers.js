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
import { BannerQueryDto, CreateBannerDto, UpdateBannerDto } from '../dtos/banner.dtos.js';
import { BannerService } from '../services/banner.service.js';
let BannerController = class BannerController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(query) {
        return this.service.listPublic(query.position);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BannerQueryDto]),
    __metadata("design:returntype", void 0)
], BannerController.prototype, "list", null);
BannerController = __decorate([
    Controller('banners'),
    __metadata("design:paramtypes", [BannerService])
], BannerController);
export { BannerController };
let BannerAdminController = class BannerAdminController {
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
], BannerAdminController.prototype, "list", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateBannerDto]),
    __metadata("design:returntype", void 0)
], BannerAdminController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateBannerDto]),
    __metadata("design:returntype", void 0)
], BannerAdminController.prototype, "update", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], BannerAdminController.prototype, "remove", null);
BannerAdminController = __decorate([
    Controller('admin/banners'),
    AdminOnly(),
    __metadata("design:paramtypes", [BannerService])
], BannerAdminController);
export { BannerAdminController };
//# sourceMappingURL=banner.controllers.js.map