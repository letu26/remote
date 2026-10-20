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
import { BusinessException, ErrorCode, ValidationException } from '../../../exceptions/index.js';
import { getDuplicateInfo, isForeignKeyReferencedError } from '../../../utils/db-error.util.js';
import { persistWithSlug } from '../../../utils/slug.util.js';
import { CatalogCacheRepository } from '../../catalog/repositories/catalog-cache.repository.js';
import { CategoryAdminRepository } from '../repositories/category-admin.repository.js';
const MAX_SLUG_LENGTH = 120;
const isSlugConflict = (error) => getDuplicateInfo(error)?.table === 'categories';
let CategoryAdminService = class CategoryAdminService {
    categories;
    cache;
    constructor(categories, cache) {
        this.categories = categories;
        this.cache = cache;
    }
    list() {
        return this.categories.findAllWithCounts();
    }
    async create(dto) {
        if (dto.parentId != null)
            await this.assertParentExists(dto.parentId);
        const id = await persistWithSlug({
            name: dto.name,
            slug: dto.slug,
            maxLength: MAX_SLUG_LENGTH,
            findTaken: (prefix) => this.categories.findSlugsStartingWith(prefix),
            isSlugConflict,
            save: (slug) => this.categories.insert({
                name: dto.name,
                slug,
                parentId: dto.parentId,
                sortOrder: dto.sortOrder,
                isActive: dto.isActive,
            }),
        });
        await this.cache.invalidate('categories');
        return this.getOrFail(id);
    }
    async update(id, dto) {
        await this.getOrFail(id);
        if (dto.parentId !== undefined && dto.parentId !== null) {
            await this.assertParentExists(dto.parentId);
            await this.assertNoCycle(id, dto.parentId);
        }
        try {
            await this.categories.update(id, dto);
        }
        catch (error) {
            if (isSlugConflict(error)) {
                throw new BusinessException(ErrorCode.SLUG_ALREADY_EXISTS, 'Slug đã tồn tại, vui lòng chọn slug khác', HttpStatus.CONFLICT, undefined, [
                    { field: 'slug', message: 'Slug đã tồn tại' },
                ]);
            }
            throw error;
        }
        await this.cache.invalidate('categories');
        return this.getOrFail(id);
    }
    async remove(id) {
        const category = await this.getOrFail(id);
        if (category.childCount > 0) {
            throw this.inUse(`Danh mục đang có ${category.childCount} danh mục con`);
        }
        if (category.productCount > 0) {
            throw this.inUse(`Danh mục đang có ${category.productCount} sản phẩm`);
        }
        try {
            await this.categories.delete(id);
        }
        catch (error) {
            if (isForeignKeyReferencedError(error))
                throw this.inUse('Danh mục đang được sử dụng');
            throw error;
        }
        await this.cache.invalidate('categories');
    }
    inUse(reason) {
        return new BusinessException(ErrorCode.RESOURCE_IN_USE, `${reason} nên không thể xóa. Hãy ẩn danh mục (isActive=false) thay vì xóa.`, HttpStatus.CONFLICT);
    }
    async getOrFail(id) {
        const category = await this.categories.findAdminById(id);
        if (!category)
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy danh mục', HttpStatus.NOT_FOUND);
        return category;
    }
    async assertParentExists(parentId) {
        if (!(await this.categories.exists(parentId))) {
            throw new ValidationException([{ field: 'parentId', message: 'Danh mục cha không tồn tại' }]);
        }
    }
    async assertNoCycle(id, newParentId) {
        const parentOf = new Map((await this.categories.findParentLinks()).map((row) => [row.id, row.parentId]));
        let cursor = newParentId;
        const visited = new Set();
        while (cursor != null && !visited.has(cursor)) {
            if (cursor === id) {
                throw new ValidationException([
                    { field: 'parentId', message: 'Danh mục cha không được là chính nó hoặc danh mục con của nó' },
                ]);
            }
            visited.add(cursor);
            cursor = parentOf.get(cursor);
        }
    }
};
CategoryAdminService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CategoryAdminRepository,
        CatalogCacheRepository])
], CategoryAdminService);
export { CategoryAdminService };
//# sourceMappingURL=category-admin.service.js.map