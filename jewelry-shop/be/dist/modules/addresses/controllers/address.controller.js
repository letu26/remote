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
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import { CreateAddressDto, UpdateAddressDto } from '../dtos/address.dtos.js';
import { AddressService } from '../services/address.service.js';
let AddressController = class AddressController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(user) {
        return this.service.list(user.id);
    }
    create(user, dto) {
        return this.service.create(user.id, dto);
    }
    update(user, id, dto) {
        return this.service.update(user.id, id, dto);
    }
    setDefault(user, id) {
        return this.service.setDefault(user.id, id);
    }
    remove(user, id) {
        return this.service.remove(user.id, id);
    }
};
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AddressController.prototype, "list", null);
__decorate([
    Post(),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateAddressDto]),
    __metadata("design:returntype", void 0)
], AddressController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseIntPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, UpdateAddressDto]),
    __metadata("design:returntype", void 0)
], AddressController.prototype, "update", null);
__decorate([
    Put(':id/default'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], AddressController.prototype, "setDefault", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], AddressController.prototype, "remove", null);
AddressController = __decorate([
    Controller('users/me/addresses'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [AddressService])
], AddressController);
export { AddressController };
//# sourceMappingURL=address.controller.js.map