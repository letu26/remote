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
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { CustomerListQueryDto, UpdateCustomerRoleDto, UpdateCustomerStatusDto } from '../dtos/customer.dtos.js';
import { CustomerAdminService } from '../services/customer-admin.service.js';
let CustomerAdminController = class CustomerAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(query) {
        return this.service.list(query);
    }
    detail(id) {
        return this.service.detail(id);
    }
    updateStatus(admin, id, dto) {
        return this.service.updateStatus(admin.id, id, dto);
    }
    updateRole(admin, id, dto) {
        return this.service.updateRole(admin.id, id, dto);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CustomerListQueryDto]),
    __metadata("design:returntype", void 0)
], CustomerAdminController.prototype, "list", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CustomerAdminController.prototype, "detail", null);
__decorate([
    Patch(':id/status'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseIntPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, UpdateCustomerStatusDto]),
    __metadata("design:returntype", void 0)
], CustomerAdminController.prototype, "updateStatus", null);
__decorate([
    Patch(':id/role'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseIntPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, UpdateCustomerRoleDto]),
    __metadata("design:returntype", void 0)
], CustomerAdminController.prototype, "updateRole", null);
CustomerAdminController = __decorate([
    Controller('admin/customers'),
    AdminOnly(),
    __metadata("design:paramtypes", [CustomerAdminService])
], CustomerAdminController);
export { CustomerAdminController };
//# sourceMappingURL=customer-admin.controller.js.map