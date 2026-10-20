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
import { CatalogCacheRepository } from '../../catalog/repositories/catalog-cache.repository.js';
import { LookupAdminRepository } from '../repositories/lookup-admin.repository.js';
const LABELS = { materials: 'Chất liệu', gemstones: 'Loại đá' };
let LookupAdminService = class LookupAdminService {
    lookups;
    cache;
    constructor(lookups, cache) {
        this.lookups = lookups;
        this.cache = cache;
    }
    list(kind) {
        return this.lookups.findAll(kind);
    }
    async create(kind, dto) {
        let id;
        try {
            id = await this.lookups.insert(kind, dto.name, dto.isActive ?? true);
        }
        catch (error) {
            throw this.mapDuplicate(kind, error);
        }
        await this.cache.invalidate(kind);
        return this.getOrFail(kind, id);
    }
    async update(kind, id, dto) {
        await this.getOrFail(kind, id);
        try {
            await this.lookups.update(kind, id, dto);
        }
        catch (error) {
            throw this.mapDuplicate(kind, error);
        }
        await this.cache.invalidate(kind);
        return this.getOrFail(kind, id);
    }
    async remove(kind, id) {
        const item = await this.getOrFail(kind, id);
        if (item.productCount > 0)
            throw this.inUse(kind, item.productCount);
        try {
            await this.lookups.delete(kind, id);
        }
        catch (error) {
            if (isForeignKeyReferencedError(error))
                throw this.inUse(kind, 1);
            throw error;
        }
        await this.cache.invalidate(kind);
    }
    inUse(kind, count) {
        return new BusinessException(ErrorCode.RESOURCE_IN_USE, `${LABELS[kind]} đang được ${count} sản phẩm sử dụng nên không thể xóa. Hãy ẩn (isActive=false) thay vì xóa.`, HttpStatus.CONFLICT);
    }
    mapDuplicate(kind, error) {
        if (getDuplicateInfo(error) === null)
            return error;
        return new BusinessException(ErrorCode.NAME_ALREADY_EXISTS, `${LABELS[kind]} đã tồn tại`, HttpStatus.CONFLICT, undefined, [
            { field: 'name', message: `${LABELS[kind]} đã tồn tại` },
        ]);
    }
    async getOrFail(kind, id) {
        const item = await this.lookups.findById(kind, id);
        if (!item)
            throw new BusinessException(ErrorCode.NOT_FOUND, `Không tìm thấy ${LABELS[kind].toLowerCase()}`, HttpStatus.NOT_FOUND);
        return item;
    }
};
LookupAdminService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [LookupAdminRepository,
        CatalogCacheRepository])
], LookupAdminService);
export { LookupAdminService };
//# sourceMappingURL=lookup-admin.service.js.map