import { CatalogService } from '../services/catalog.service.js';
export declare class CatalogController {
    private readonly catalog;
    constructor(catalog: CatalogService);
    categories(): Promise<import("../models/catalog.types.js").CategoryNode[]>;
    materials(): Promise<import("../models/catalog.types.js").NamedItem[]>;
    gemstones(): Promise<import("../models/catalog.types.js").NamedItem[]>;
    collections(): Promise<import("../models/catalog.types.js").CollectionItem[]>;
}
