import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { type Page, resolvePage, toPage } from '../../../utils/pagination.js';
import type { ProductListQueryDto } from '../dtos/product-query.dto.js';
import type { CategoryRef, ProductListFilter, ProductListRow } from '../models/catalog.types.js';
import { TargetGroup } from '../models/product.entity.js';
import { ProductQueryRepository } from '../repositories/product-query.repository.js';
import { type CategoryIndex, CatalogService } from './catalog.service.js';

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;
const RELATED_LIMIT = 8;

export interface ProductListItem {
  id: number;
  code: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  discountPercent: number | null;
  primaryImageUrl: string | null;
  inStock: boolean;
  avgRating: number;
  reviewCount: number;
  isFeatured: boolean;
  targetGroup: TargetGroup;
  category: CategoryRef;
}

/** women/men gồm cả unisex; kids và unisex chỉ chính nó. */
function expandTargetGroup(group: TargetGroup): TargetGroup[] {
  if (group === TargetGroup.WOMEN) return [TargetGroup.WOMEN, TargetGroup.UNISEX];
  if (group === TargetGroup.MEN) return [TargetGroup.MEN, TargetGroup.UNISEX];
  return [group];
}

export function computeSalePrice(price: number, discountPercent: number | null): number | null {
  return discountPercent == null ? null : Math.round((price * (100 - discountPercent)) / 100);
}

@Injectable()
export class ProductCatalogService {
  constructor(
    private readonly products: ProductQueryRepository,
    private readonly catalog: CatalogService,
  ) {}

  async list(query: ProductListQueryDto): Promise<Page<ProductListItem>> {
    const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const categories = this.catalog.flattenTree(await this.catalog.getCategoryTree());

    let categoryIds = [...categories.keys()];
    if (query.category) {
      const match = [...categories.values()].find(({ node }) => node.slug === query.category);
      categoryIds = match ? this.catalog.collectIds(match.node) : [];
    }

    let collectionId: number | undefined;
    if (query.collection) {
      const collections = await this.catalog.getCollections();
      collectionId = collections.find((item) => item.slug === query.collection)?.id;
      if (collectionId === undefined) categoryIds = [];
    }

    if (!categoryIds.length) return toPage([], 0, request);

    const filter: ProductListFilter = {
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

  async getBySlug(slug: string) {
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

  private async findRelated(
    productId: number,
    categoryId: number,
    categories: CategoryIndex,
    now: Date,
  ): Promise<ProductListItem[]> {
    const filter: ProductListFilter = { categoryIds: [categoryId], excludeProductId: productId };
    const rows = await this.products.findPage(filter, 'newest', RELATED_LIMIT, 0, now);
    return this.toItems(rows, categories);
  }

  toItems(rows: ProductListRow[], categories: CategoryIndex): ProductListItem[] {
    return rows.map(({ categoryId, ...row }) => {
      const path = categories.get(categoryId)?.path;
      return {
        ...row,
        salePrice: computeSalePrice(row.price, row.discountPercent),
        category: path?.[path.length - 1] ?? { id: categoryId, name: '', slug: '' },
      };
    });
  }
}
