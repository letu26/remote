import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { type Page, PageQueryDto, resolvePage, toPage } from '../../../utils/pagination.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
import { type ProductListItem, ProductCatalogService } from '../../catalog/services/product-catalog.service.js';
import { ProductQueryRepository } from '../../catalog/repositories/product-query.repository.js';
import { WishlistRepository } from '../repositories/wishlist.repository.js';

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

export type WishlistItem = ProductListItem & { addedAt: Date };

@Injectable()
export class WishlistService {
  constructor(
    private readonly wishlist: WishlistRepository,
    private readonly products: ProductQueryRepository,
    private readonly productCatalog: ProductCatalogService,
    private readonly catalog: CatalogService,
  ) {}

  async list(userId: number, query: PageQueryDto): Promise<Page<WishlistItem>> {
    const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const categories = this.catalog.flattenTree(await this.catalog.getCategoryTree());
    const categoryIds = [...categories.keys()];
    if (!categoryIds.length) return toPage([], 0, request);

    const { entries, total } = await this.wishlist.findPage(userId, categoryIds, request.pageSize, request.offset);
    // Cùng truy vấn gộp với danh sách sản phẩm: một lần cho cả trang.
    const rows = await this.products.findActiveByIds(
      entries.map((entry) => entry.productId),
      new Date(),
    );
    const itemById = new Map(this.productCatalog.toItems(rows, categories).map((item) => [item.id, item]));
    const items = entries.flatMap((entry) => {
      const item = itemById.get(entry.productId);
      return item ? [{ ...item, addedAt: entry.addedAt }] : [];
    });
    return toPage(items, total, request);
  }

  async listIds(userId: number): Promise<{ productIds: number[] }> {
    return { productIds: await this.wishlist.findAllProductIds(userId) };
  }

  async add(userId: number, productId: number): Promise<{ productId: number; created: boolean }> {
    const categoryId = await this.wishlist.findActiveProductCategoryId(productId);
    // Cùng điều kiện hiển thị với GET /products: sản phẩm ẩn hoặc thuộc danh mục ẩn (kể cả tổ tiên ẩn) coi như không có.
    const visible = this.catalog.flattenTree(await this.catalog.getCategoryTree());
    if (categoryId === null || !visible.has(categoryId)) {
      throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy sản phẩm', HttpStatus.NOT_FOUND);
    }
    return { productId, created: await this.wishlist.add(userId, productId) };
  }

  remove(userId: number, productId: number): Promise<void> {
    return this.wishlist.remove(userId, productId);
  }
}
