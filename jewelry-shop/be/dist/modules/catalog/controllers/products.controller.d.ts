import { ProductListQueryDto } from '../dtos/product-query.dto.js';
import { ProductCatalogService } from '../services/product-catalog.service.js';
export declare class ProductsController {
    private readonly products;
    constructor(products: ProductCatalogService);
    list(query: ProductListQueryDto): Promise<import("../../../utils/pagination.js").Page<import("../services/product-catalog.service.js").ProductListItem>>;
    detail(slug: string): Promise<{
        salePrice: number | null;
        inStock: boolean;
        category: import("../models/catalog.types.js").CategoryRef;
        breadcrumb: import("../models/catalog.types.js").CategoryRef[];
        material: {
            id: number;
            name: string;
        } | null;
        collection: {
            id: number;
            name: string;
            slug: string;
        } | null;
        images: import("../models/catalog.types.js").ImageRow[];
        variants: {
            id: number;
            sku: string;
            size: string;
            stock: number;
        }[];
        gemstones: import("../models/catalog.types.js").GemstoneRow[];
        related: import("../services/product-catalog.service.js").ProductListItem[];
        id: number;
        code: string;
        name: string;
        slug: string;
        description: string | null;
        price: number;
        discountPercent: number | null;
        targetGroup: import("../models/product.entity.js").TargetGroup;
        weight: number | null;
        warrantyInfo: string | null;
        certificate: string | null;
        isFeatured: boolean;
        avgRating: number;
        reviewCount: number;
        soldCount: number;
    }>;
}
