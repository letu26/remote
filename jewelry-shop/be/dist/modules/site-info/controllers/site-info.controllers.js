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
import { Body, Controller, Get, Put } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { SiteInfoDto } from '../dtos/site-info.dtos.js';
import { SiteInfoService } from '../services/site-info.service.js';
let SiteInfoController = class SiteInfoController {
    service;
    constructor(service) {
        this.service = service;
    }
    get() {
        return this.service.get();
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SiteInfoController.prototype, "get", null);
SiteInfoController = __decorate([
    Controller('site-info'),
    __metadata("design:paramtypes", [SiteInfoService])
], SiteInfoController);
export { SiteInfoController };
let SiteInfoAdminController = class SiteInfoAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    get() {
        return this.service.get();
    }
    save(dto) {
        return this.service.save(dto);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SiteInfoAdminController.prototype, "get", null);
__decorate([
    Put(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SiteInfoDto]),
    __metadata("design:returntype", void 0)
], SiteInfoAdminController.prototype, "save", null);
SiteInfoAdminController = __decorate([
    Controller('admin/settings/site-info'),
    AdminOnly(),
    __metadata("design:paramtypes", [SiteInfoService])
], SiteInfoAdminController);
export { SiteInfoAdminController };
//# sourceMappingURL=site-info.controllers.js.map