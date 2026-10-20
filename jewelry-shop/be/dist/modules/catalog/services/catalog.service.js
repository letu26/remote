var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { CatalogCacheRepository } from '../repositories/catalog-cache.repository.js';
import { CatalogLookupRepository } from '../repositories/catalog-lookup.repository.js';
let CatalogService = class CatalogService {
    lookups;
    cache;
    constructor(lookups, cache) {
        this.lookups = lookups;
        this.cache = cache;
    }
    async getCategoryTree() {
        const cached = await this.cache.get('categories');
        if (cached)
            return cached;
        const rows = await this.lookups.findActiveCategories();
        const childrenByParent = new Map();
        for (const row of rows) {
            const siblings = childrenByParent.get(row.parentId) ?? [];
            siblings.push(row);
            childrenByParent.set(row.parentId, siblings);
        }
        const build = (parentId) => (childrenByParent.get(parentId) ?? []).map((row) => ({ ...row, children: build(row.id) }));
        const tree = build(null);
        await this.cache.set('categories', tree);
        return tree;
    }
    async getMaterials() {
        const cached = await this.cache.get('materials');
        if (cached)
            return cached;
        const items = await this.lookups.findActiveMaterials();
        await this.cache.set('materials', items);
        return items;
    }
    async getGemstones() {
        const cached = await this.cache.get('gemstones');
        if (cached)
            return cached;
        const items = await this.lookups.findActiveGemstones();
        await this.cache.set('gemstones', items);
        return items;
    }
    async getCollections() {
        const cached = await this.cache.get('collections');
        if (cached)
            return cached;
        const items = await this.lookups.findActiveCollections();
        await this.cache.set('collections', items);
        return items;
    }
    flattenTree(tree) {
        const result = new Map();
        const walk = (nodes, parentPath) => {
            for (const node of nodes) {
                const path = [...parentPath, { id: node.id, name: node.name, slug: node.slug }];
                result.set(node.id, { node, path });
                walk(node.children, path);
            }
        };
        walk(tree, []);
        return result;
    }
    collectIds(node) {
        return [node.id, ...node.children.flatMap((child) => this.collectIds(child))];
    }
};
CatalogService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CatalogLookupRepository,
        CatalogCacheRepository])
], CatalogService);
export { CatalogService };
//# sourceMappingURL=catalog.service.js.map