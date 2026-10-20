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
import { isForeignKeyReferencedError } from '../../../utils/db-error.util.js';
import { CacheService } from '../../redis/services/cache.service.js';
import { MenuRepository } from '../repositories/menu.repository.js';
const CACHE_TTL_SECONDS = 300;
const cacheKey = (placement) => `menus:${placement}`;
let MenuService = class MenuService {
    menus;
    cache;
    constructor(menus, cache) {
        this.menus = menus;
        this.cache = cache;
    }
    async getTree(placement = 'header') {
        const cached = await this.cache.get(cacheKey(placement));
        if (cached)
            return cached;
        const rows = await this.menus.findActiveByPlacement(placement);
        const roots = rows.filter((row) => row.parentId === null);
        const tree = roots.map((root) => ({
            id: root.id,
            label: root.label,
            url: root.url,
            children: rows
                .filter((row) => row.parentId === root.id)
                .map(({ id, label, url }) => ({ id, label, url })),
        }));
        await this.cache.set(cacheKey(placement), tree, CACHE_TTL_SECONDS);
        return tree;
    }
    listAll() {
        return this.menus.findAll();
    }
    async create(dto) {
        const placement = dto.placement ?? 'header';
        const id = await this.menus.runInTransaction(async (tx) => {
            if (dto.parentId != null)
                await this.assertValidParent(tx, dto.parentId, placement);
            return tx.insert({
                label: dto.label,
                url: dto.url,
                parentId: dto.parentId ?? null,
                placement,
                sortOrder: dto.sortOrder,
                isActive: dto.isActive,
            });
        });
        await this.invalidate();
        return this.getOrFail(id);
    }
    async update(id, dto) {
        await this.menus.runInTransaction(async (tx) => {
            const current = await tx.lock(id);
            if (!current)
                throw this.notFound();
            const parentId = dto.parentId === undefined ? current.parentId : dto.parentId;
            const placement = dto.placement ?? current.placement;
            if (parentId !== null) {
                if (parentId === id)
                    throw this.invalid('parentId', 'Một mục không thể là con của chính nó');
                if (dto.parentId !== undefined && (await tx.countChildren(id)) > 0) {
                    throw this.invalid('parentId', 'Mục đang có mục con nên không thể trở thành mục con (tối đa 2 cấp)');
                }
                await this.assertValidParent(tx, parentId, placement);
            }
            await tx.update(id, {
                label: dto.label,
                url: dto.url,
                parentId: dto.parentId,
                placement: dto.placement,
                sortOrder: dto.sortOrder,
                isActive: dto.isActive,
            });
            if (parentId === null && placement !== current.placement)
                await tx.setChildrenPlacement(id, placement);
        });
        await this.invalidate();
        return this.getOrFail(id);
    }
    async remove(id) {
        await this.getOrFail(id);
        if ((await this.menus.countChildren(id)) > 0)
            throw this.hasChildren();
        try {
            await this.menus.delete(id);
        }
        catch (error) {
            if (isForeignKeyReferencedError(error))
                throw this.hasChildren();
            throw error;
        }
        await this.invalidate();
    }
    async assertValidParent(tx, parentId, placement) {
        const parent = await tx.lock(parentId);
        if (!parent)
            throw this.invalid('parentId', 'Mục cha không tồn tại');
        if (parent.parentId !== null)
            throw this.invalid('parentId', 'Mục cha phải là mục gốc (tối đa 2 cấp)');
        if (parent.placement !== placement)
            throw this.invalid('parentId', 'Mục cha phải cùng vị trí hiển thị');
    }
    invalidate() {
        return this.cache.delete(cacheKey('header'), cacheKey('footer'));
    }
    invalid(field, message) {
        return new ValidationException([{ field, message }]);
    }
    hasChildren() {
        return new BusinessException(ErrorCode.RESOURCE_IN_USE, 'Mục menu đang có mục con, hãy xóa các mục con trước', HttpStatus.CONFLICT);
    }
    notFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy mục menu', HttpStatus.NOT_FOUND);
    }
    async getOrFail(id) {
        const menu = await this.menus.findById(id);
        if (!menu)
            throw this.notFound();
        return menu;
    }
};
MenuService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [MenuRepository,
        CacheService])
], MenuService);
export { MenuService };
//# sourceMappingURL=menu.service.js.map