import { Repository } from 'typeorm';
import { Category } from '../models/category.entity.js';
import { Collection } from '../models/collection.entity.js';
import { Gemstone } from '../models/gemstone.entity.js';
import { Material } from '../models/material.entity.js';
import type { CollectionItem, NamedItem } from '../models/catalog.types.js';
export interface ActiveCategoryRow {
    id: number;
    name: string;
    slug: string;
    parentId: number | null;
    sortOrder: number;
}
export declare class CatalogLookupRepository {
    private readonly categories;
    private readonly materials;
    private readonly gemstones;
    private readonly collections;
    constructor(categories: Repository<Category>, materials: Repository<Material>, gemstones: Repository<Gemstone>, collections: Repository<Collection>);
    findActiveCategories(): Promise<ActiveCategoryRow[]>;
    findActiveMaterials(): Promise<NamedItem[]>;
    findActiveGemstones(): Promise<NamedItem[]>;
    findActiveCollections(): Promise<CollectionItem[]>;
}
