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
import { Category } from '../models/category.entity.js';
import { Collection } from '../models/collection.entity.js';
import { Gemstone } from '../models/gemstone.entity.js';
import { Material } from '../models/material.entity.js';
let CatalogLookupRepository = class CatalogLookupRepository {
    categories;
    materials;
    gemstones;
    collections;
    constructor(categories, materials, gemstones, collections) {
        this.categories = categories;
        this.materials = materials;
        this.gemstones = gemstones;
        this.collections = collections;
    }
    findActiveCategories() {
        return this.categories.find({
            select: { id: true, name: true, slug: true, parentId: true, sortOrder: true },
            where: { isActive: true },
            order: { sortOrder: 'ASC', name: 'ASC', id: 'ASC' },
        });
    }
    findActiveMaterials() {
        return this.materials.find({ select: { id: true, name: true }, where: { isActive: true }, order: { name: 'ASC' } });
    }
    findActiveGemstones() {
        return this.gemstones.find({ select: { id: true, name: true }, where: { isActive: true }, order: { name: 'ASC' } });
    }
    findActiveCollections() {
        return this.collections.find({
            select: { id: true, name: true, slug: true, description: true, bannerUrl: true },
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }
};
CatalogLookupRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(Category)),
    __param(1, InjectRepository(Material)),
    __param(2, InjectRepository(Gemstone)),
    __param(3, InjectRepository(Collection)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository])
], CatalogLookupRepository);
export { CatalogLookupRepository };
//# sourceMappingURL=catalog-lookup.repository.js.map