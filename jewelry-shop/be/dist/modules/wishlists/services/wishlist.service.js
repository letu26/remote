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
import { resolvePage, toPage } from '../../../utils/pagination.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
import { ProductCatalogService } from '../../catalog/services/product-catalog.service.js';
import { ProductQueryRepository } from '../../catalog/repositories/product-query.repository.js';
import { WishlistRepository } from '../repositories/wishlist.repository.js';
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;
let WishlistService = class WishlistService {
    wishlist;
    products;
    productCatalog;
    catalog;
    constructor(wishlist, products, productCatalog, catalog) {
        this.wishlist = wishlist;
        this.products = products;
        this.productCatalog = productCatalog;
        this.catalog = catalog;
    }
    async list(userId, query) {
        const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const categories = this.catalog.flattenTree(await this.catalog.getCategoryTree());
        const categoryIds = [...categories.keys()];
        if (!categoryIds.length)
            return toPage([], 0, request);
        const { entries, total } = await this.wishlist.findPage(userId, categoryIds, request.pageSize, request.offset);
        const rows = await this.products.findActiveByIds(entries.map((entry) => entry.productId), new Date());
        const itemById = new Map(this.productCatalog.toItems(rows, categories).map((item) => [item.id, item]));
        const items = entries.flatMap((entry) => {
            const item = itemById.get(entry.productId);
            return item ? [{ ...item, addedAt: entry.addedAt }] : [];
        });
        return toPage(items, total, request);
    }
    async listIds(userId) {
        return { productIds: await this.wishlist.findAllProductIds(userId) };
    }
    async add(userId, productId) {
        const categoryId = await this.wishlist.findActiveProductCategoryId(productId);
        const visible = this.catalog.flattenTree(await this.catalog.getCategoryTree());
        if (categoryId === null || !visible.has(categoryId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy sản phẩm', HttpStatus.NOT_FOUND);
        }
        return { productId, created: await this.wishlist.add(userId, productId) };
    }
    remove(userId, productId) {
        return this.wishlist.remove(userId, productId);
    }
};
WishlistService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [WishlistRepository,
        ProductQueryRepository,
        ProductCatalogService,
        CatalogService])
], WishlistService);
export { WishlistService };
//# sourceMappingURL=wishlist.service.js.map