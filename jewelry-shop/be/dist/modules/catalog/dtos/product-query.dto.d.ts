import { PageQueryDto } from '../../../utils/pagination.js';
import { TargetGroup } from '../models/product.entity.js';
export declare const PRODUCT_SORTS: readonly ["newest", "price_asc", "price_desc", "bestseller", "rating"];
export declare class ProductListQueryDto extends PageQueryDto {
    q?: string;
    category?: string;
    collection?: string;
    material?: number;
    gemstone?: number[];
    targetGroup?: TargetGroup;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    onSale?: boolean;
    featured?: boolean;
    sort?: (typeof PRODUCT_SORTS)[number];
}
