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
import { getDuplicateInfo, isForeignKeyReferencedError } from '../../../utils/db-error.util.js';
import { persistWithSlug } from '../../../utils/slug.util.js';
import { CatalogCacheRepository } from '../../catalog/repositories/catalog-cache.repository.js';
import { CollectionAdminRepository } from '../repositories/collection-admin.repository.js';
const MAX_SLUG_LENGTH = 170;
const isSlugConflict = (error) => getDuplicateInfo(error)?.table === 'collections';
let CollectionAdminService = class CollectionAdminService {
    collections;
    cache;
    constructor(collections, cache) {
        this.collections = collections;
        this.cache = cache;
    }
    list() {
        return this.collections.findAll();
    }
    async create(dto) {
        const id = await persistWithSlug({
            name: dto.name,
            slug: dto.slug,
            maxLength: MAX_SLUG_LENGTH,
            findTaken: (prefix) => this.collections.findSlugsStartingWith(prefix),
            isSlugConflict,
            save: (slug) => this.collections.insert({
                name: dto.name,
                slug,
                description: dto.description,
                bannerUrl: dto.bannerUrl,
                isActive: dto.isActive,
            }),
        });
        await this.cache.invalidate('collections');
        return this.getOrFail(id);
    }
    async update(id, dto) {
        await this.getOrFail(id);
        try {
            await this.collections.update(id, dto);
        }
        catch (error) {
            if (isSlugConflict(error)) {
                throw new BusinessException(ErrorCode.SLUG_ALREADY_EXISTS, 'Slug đã tồn tại, vui lòng chọn slug khác', HttpStatus.CONFLICT, undefined, [
                    { field: 'slug', message: 'Slug đã tồn tại' },
                ]);
            }
            throw error;
        }
        await this.cache.invalidate('collections');
        return this.getOrFail(id);
    }
    async remove(id) {
        const collection = await this.getOrFail(id);
        if (collection.productCount > 0)
            throw this.inUse(collection.productCount);
        try {
            await this.collections.delete(id);
        }
        catch (error) {
            if (isForeignKeyReferencedError(error))
                throw this.inUse(1);
            throw error;
        }
        await this.cache.invalidate('collections');
    }
    inUse(count) {
        return new BusinessException(ErrorCode.RESOURCE_IN_USE, `Bộ sưu tập đang có ${count} sản phẩm nên không thể xóa. Hãy ẩn (isActive=false) thay vì xóa.`, HttpStatus.CONFLICT);
    }
    async getOrFail(id) {
        const collection = await this.collections.findById(id);
        if (!collection)
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy bộ sưu tập', HttpStatus.NOT_FOUND);
        return collection;
    }
};
CollectionAdminService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CollectionAdminRepository,
        CatalogCacheRepository])
], CollectionAdminService);
export { CollectionAdminService };
//# sourceMappingURL=collection-admin.service.js.map