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
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from '../models/province.entity.js';
import { Ward } from '../models/ward.entity.js';
let LocationRepository = class LocationRepository {
    provinces;
    wards;
    constructor(provinces, wards) {
        this.provinces = provinces;
        this.wards = wards;
    }
    findProvinces() {
        return this.provinces.find({ select: { id: true, code: true, name: true }, order: { name: 'ASC', id: 'ASC' } });
    }
    async provinceExists(id) {
        return (await this.provinces.count({ where: { id } })) > 0;
    }
    findWardsByProvince(provinceId) {
        return this.wards.find({
            select: { id: true, code: true, name: true },
            where: { provinceId },
            order: { name: 'ASC', id: 'ASC' },
        });
    }
};
LocationRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(Province)),
    __param(1, InjectRepository(Ward)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], LocationRepository);
export { LocationRepository };
//# sourceMappingURL=location.repository.js.map