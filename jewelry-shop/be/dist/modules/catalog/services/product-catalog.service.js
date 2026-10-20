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
import { TargetGroup } from '../models/product.entity.js';
import { ProductQueryRepository } from '../repositories/product-query.repository.js';
import { CatalogService } from './catalog.service.js';
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;
const RELATED_LIMIT = 8;
function expandTargetGroup(group) {
    if (group === TargetGroup.WOMEN)
        return [TargetGroup.WOMEN, TargetGroup.UNISEX];
    if (group === TargetGroup.MEN)
        return [TargetGroup.MEN, TargetGroup.UNISEX];
    return [group];
}
export function computeSalePrice(price, discountPercent) {
    return discountPercent == null ? null : Math.round((price * (100 - discountPercent)) / 100);
}
let ProductCatalogService = class ProductCatalogService {
    products;
    catalog;
    constructor(products, catalog) {
        this.products = products;
        this.catalog = catalog;
    }
    async list(query) {
        const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const categories = this.catalog.flattenTree(await this.catalog.getCategoryTree());
        let categoryIds = [...categories.keys()];
        if (query.category) {
            const match = [...categories.values()].find(({ node }) => node.slug === query.category);
            categoryIds = match ? this.catalog.collectIds(match.node) : [];
        }
        let collectionId;
        if (query.collection) {
            const collections = await this.catalog.getCollections();
            collectionId = collections.find((item) => item.slug === query.collection)?.id;
            if (collectionId === undefined)
                categoryIds = [];
        }
        if (!categoryIds.length)
            return toPage([], 0, request);
        const filter = {
            categoryIds,
            collectionId,
            materialId: query.material,
            gemstoneIds: query.gemstone,
            targetGroups: query.targetGroup ? expandTargetGroup(query.targetGroup) : undefined,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            q: query.q || undefined,
            inStock: query.inStock,
            onSale: query.onSale,
            featured: query.featured,
        };
        const now = new Date();
        const [total, rows] = await Promise.all([
            this.products.count(filter, now),
            this.products.findPage(filter, query.sort ?? 'newest', request.pageSize, request.offset, now),
        ]);
        return toPage(this.toItems(rows, categories), total, request);
    }
    async getBySlug(slug) {
        const now = new Date();
        const product = await this.products.findActiveBySlug(slug, now);
        const categories = this.catalog.flattenTree(await this.catalog.getCategoryTree());
        const category = product ? categories.get(product.categoryId) : undefined;
        if (!product || !category) {
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy sản phẩm', HttpStatus.NOT_FOUND);
        }
        const [images, variants, gemstones, materials, collections, related] = await Promise.all([
            this.products.findImages(product.id),
            this.products.findActiveVariants(product.id),
            this.products.findGemstones(product.id),
            product.materialId ? this.catalog.getMaterials() : Promise.resolve([]),
            product.collectionId ? this.catalog.getCollections() : Promise.resolve([]),
            this.findRelated(product.id, product.categoryId, categories, now),
        ]);
        const { categoryId: _categoryId, materialId, collectionId, ...base } = product;
        const material = materialId ? materials.find((item) => item.id === materialId) : undefined;
        const collection = collectionId ? collections.find((item) => item.id === collectionId) : undefined;
        return {
            ...base,
            salePrice: computeSalePrice(product.price, product.discountPercent),
            inStock: variants.some((variant) => variant.stock > 0),
            category: category.path[category.path.length - 1],
            breadcrumb: category.path,
            material: material ? { id: material.id, name: material.name } : null,
            collection: collection ? { id: collection.id, name: collection.name, slug: collection.slug } : null,
            images,
            variants: variants.map(({ id, sku, size, stock }) => ({ id, sku, size, stock })),
            gemstones,
            related,
        };
    }
    async findRelated(productId, categoryId, categories, now) {
        const filter = { categoryIds: [categoryId], excludeProductId: productId };
        const rows = await this.products.findPage(filter, 'newest', RELATED_LIMIT, 0, now);
        return this.toItems(rows, categories);
    }
    toItems(rows, categories) {
        return rows.map(({ categoryId, ...row }) => {
            const path = categories.get(categoryId)?.path;
            return {
                ...row,
                salePrice: computeSalePrice(row.price, row.discountPercent),
                category: path?.[path.length - 1] ?? { id: categoryId, name: '', slug: '' },
            };
        });
    }
};
ProductCatalogService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ProductQueryRepository,
        CatalogService])
], ProductCatalogService);
export { ProductCatalogService };
//# sourceMappingURL=product-catalog.service.js.map