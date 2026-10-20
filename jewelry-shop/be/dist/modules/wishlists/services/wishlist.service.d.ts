import { type Page, PageQueryDto } from '../../../utils/pagination.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
import { type ProductListItem, ProductCatalogService } from '../../catalog/services/product-catalog.service.js';
import { ProductQueryRepository } from '../../catalog/repositories/product-query.repository.js';
import { WishlistRepository } from '../repositories/wishlist.repository.js';
export type WishlistItem = ProductListItem & {
    addedAt: Date;
};
export declare class WishlistService {
    private readonly wishlist;
    private readonly products;
    private readonly productCatalog;
    private readonly catalog;
    constructor(wishlist: WishlistRepository, products: ProductQueryRepository, productCatalog: ProductCatalogService, catalog: CatalogService);
    list(userId: number, query: PageQueryDto): Promise<Page<WishlistItem>>;
    listIds(userId: number): Promise<{
        productIds: number[];
    }>;
    add(userId: number, productId: number): Promise<{
        productId: number;
        created: boolean;
    }>;
    remove(userId: number, productId: number): Promise<void>;
}
