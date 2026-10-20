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
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { LocationService } from '../services/location.service.js';
let LocationController = class LocationController {
    service;
    constructor(service) {
        this.service = service;
    }
    provinces() {
        return this.service.getProvinces();
    }
    wards(provinceId) {
        return this.service.getWards(provinceId);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "provinces", null);
__decorate([
    Get(':provinceId/wards'),
    __param(0, Param('provinceId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "wards", null);
LocationController = __decorate([
    Controller('locations/provinces'),
    __metadata("design:paramtypes", [LocationService])
], LocationController);
export { LocationController };
//# sourceMappingURL=location.controller.js.map