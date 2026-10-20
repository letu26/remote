import type { CategoryNode, CategoryRef, CollectionItem, NamedItem } from '../models/catalog.types.js';
import { CatalogCacheRepository } from '../repositories/catalog-cache.repository.js';
import { CatalogLookupRepository } from '../repositories/catalog-lookup.repository.js';
export type CategoryIndex = Map<number, {
    node: CategoryNode;
    path: CategoryRef[];
}>;
export declare class CatalogService {
    private readonly lookups;
    private readonly cache;
    constructor(lookups: CatalogLookupRepository, cache: CatalogCacheRepository);
    getCategoryTree(): Promise<CategoryNode[]>;
    getMaterials(): Promise<NamedItem[]>;
    getGemstones(): Promise<NamedItem[]>;
    getCollections(): Promise<CollectionItem[]>;
    flattenTree(tree: CategoryNode[]): CategoryIndex;
    collectIds(node: CategoryNode): number[];
}
