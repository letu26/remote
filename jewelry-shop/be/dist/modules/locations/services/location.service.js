var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { LocationCacheRepository } from '../repositories/location-cache.repository.js';
import { LocationRepository } from '../repositories/location.repository.js';
let LocationService = class LocationService {
    locations;
    cache;
    constructor(locations, cache) {
        this.locations = locations;
        this.cache = cache;
    }
    async getProvinces() {
        const cached = await this.cache.get('provinces');
        if (cached)
            return cached;
        const items = await this.locations.findProvinces();
        await this.cache.set('provinces', items);
        return items;
    }
    async getWards(provinceId) {
        const key = `wards:${provinceId}`;
        const cached = await this.cache.get(key);
        if (cached)
            return cached;
        if (!(await this.locations.provinceExists(provinceId))) {
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy tỉnh/thành', HttpStatus.NOT_FOUND);
        }
        const items = await this.locations.findWardsByProvince(provinceId);
        await this.cache.set(key, items);
        return items;
    }
};
LocationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [LocationRepository,
        LocationCacheRepository])
], LocationService);
export { LocationService };
//# sourceMappingURL=location.service.js.map