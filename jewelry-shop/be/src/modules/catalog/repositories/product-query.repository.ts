import { toBool } from '../../../utils/db-error.util.js';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type {
  GemstoneRow,
  ImageRow,
  ProductDetailRow,
  ProductListFilter,
  ProductListRow,
  ProductSort,
  VariantRow,
} from '../models/catalog.types.js';
import type { TargetGroup } from '../models/product.entity.js';

/** Khuyến mại hiệu lực: lấy mức giảm cao nhất theo sản phẩm. Hai tham số `?` đầu là `now`. */
export const ACTIVE_PROMOTION_JOIN = `
  LEFT JOIN (
    SELECT productId, MAX(discountPercent) AS discountPercent
    FROM promotions
    WHERE isActive = 1 AND startsAt <= ? AND endsAt >= ?
    GROUP BY productId
  ) pr ON pr.productId = p.id`;

const EFFECTIVE_PRICE = 'IF(pr.discountPercent IS NULL, p.price, ROUND(p.price * (100 - pr.discountPercent) / 100))';

const ORDER_BY: Record<ProductSort, string> = {
  newest: 'p.createdAt DESC, p.id DESC',
  price_asc: `${EFFECTIVE_PRICE} ASC, p.id DESC`,
  price_desc: `${EFFECTIVE_PRICE} DESC, p.id DESC`,
  bestseller: 'p.soldCount DESC, p.id DESC',
  rating: 'p.avgRating DESC, p.reviewCount DESC, p.id DESC',
};

const IN_STOCK_EXISTS =
  'EXISTS (SELECT 1 FROM product_variants v WHERE v.productId = p.id AND v.isActive = 1 AND v.stock > 0)';

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

interface RawListRow {
  id: number;
  code: string;
  name: string;
  slug: string;
  price: string;
  discountPercent: number | null;
  categoryId: number;
  avgRating: string;
  reviewCount: number;
  isFeatured: number;
  targetGroup: TargetGroup;
  inStock: number;
}

interface RawDetailRow extends Omit<ProductDetailRow, 'price' | 'weight' | 'avgRating' | 'isFeatured'> {
  price: string;
  weight: string | null;
  avgRating: string;
  isFeatured: number;
}

/** Truy vấn đọc sản phẩm cho khách. Mọi giá trị từ người dùng đều là tham số `?`. */
@Injectable()
export class ProductQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async count(filter: ProductListFilter, now: Date): Promise<number> {
    const { where, params } = this.buildWhere(filter);
    const rows: { total: string }[] = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM products p ${ACTIVE_PROMOTION_JOIN} WHERE ${where}`,
      [now, now, ...params],
    );
    return Number(rows[0]?.total ?? 0);
  }

  /** Một trang sản phẩm: 1 truy vấn chính + 1 truy vấn gộp ảnh đại diện cho cả trang. */
  async findPage(
    filter: ProductListFilter,
    sort: ProductSort,
    limit: number,
    offset: number,
    now: Date,
  ): Promise<ProductListRow[]> {
    const { where, params } = this.buildWhere(filter);
    return this.queryListRows(where, params, ORDER_BY[sort], limit, offset, now);
  }

  /** Sản phẩm đang bán theo danh sách id, giữ thứ tự id truyền vào (dùng cho yêu thích). */
  async findActiveByIds(ids: number[], now: Date): Promise<ProductListRow[]> {
    if (!ids.length) return [];
    const rows = await this.queryListRows('p.isActive = 1 AND p.id IN (?)', [ids], 'p.id ASC', ids.length, 0, now);
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.flatMap((id) => {
      const row = byId.get(id);
      return row ? [row] : [];
    });
  }

  /** Truy vấn dùng chung cho mọi danh sách sản phẩm: cùng cột, cùng cách tính khuyến mại, ảnh đại diện lấy gộp. */
  private async queryListRows(
    where: string,
    params: unknown[],
    orderBy: string,
    limit: number,
    offset: number,
    now: Date,
  ): Promise<ProductListRow[]> {
    const rows: RawListRow[] = await this.dataSource.query(
      `SELECT p.id, p.code, p.name, p.slug, p.price, pr.discountPercent, p.categoryId, p.avgRating,
              p.reviewCount, p.isFeatured, p.targetGroup, ${IN_STOCK_EXISTS} AS inStock
       FROM products p ${ACTIVE_PROMOTION_JOIN}
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [now, now, ...params, limit, offset],
    );
    const ids = rows.map((row) => row.id);
    const [images, variants] = await Promise.all([this.findPrimaryImageUrls(ids), this.findVariantSummaries(ids)]);
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      slug: row.slug,
      price: Number(row.price),
      discountPercent: row.discountPercent,
      categoryId: row.categoryId,
      primaryImageUrl: images.get(row.id) ?? null,
      inStock: toBool(row.inStock),
      variantCount: variants.get(row.id)?.count ?? 0,
      singleVariantId: variants.get(row.id)?.count === 1 ? (variants.get(row.id)?.minId ?? null) : null,
      avgRating: Number(row.avgRating),
      reviewCount: row.reviewCount,
      isFeatured: toBool(row.isFeatured),
      targetGroup: row.targetGroup,
    }));
  }

  async findActiveBySlug(slug: string, now: Date): Promise<ProductDetailRow | null> {
    const rows: RawDetailRow[] = await this.dataSource.query(
      `SELECT p.id, p.code, p.name, p.slug, p.description, p.price, pr.discountPercent, p.targetGroup, p.weight,
              p.warrantyInfo, p.certificate, p.isFeatured, p.avgRating, p.reviewCount, p.soldCount,
              p.categoryId, p.materialId, p.collectionId
       FROM products p ${ACTIVE_PROMOTION_JOIN}
       WHERE p.slug = ? AND p.isActive = 1
       LIMIT 1`,
      [now, now, slug],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      ...row,
      price: Number(row.price),
      weight: row.weight == null ? null : Number(row.weight),
      avgRating: Number(row.avgRating),
      isFeatured: toBool(row.isFeatured),
    };
  }

  async findImages(productId: number): Promise<ImageRow[]> {
    const rows: (Omit<ImageRow, 'isPrimary'> & { isPrimary: number })[] = await this.dataSource.query(
      'SELECT id, url, isPrimary, sortOrder FROM product_images WHERE productId = ? ORDER BY sortOrder ASC, id ASC',
      [productId],
    );
    return rows.map((row) => ({ ...row, isPrimary: toBool(row.isPrimary) }));
  }

  async findActiveVariants(productId: number): Promise<VariantRow[]> {
    const rows: (Omit<VariantRow, 'isActive'> & { isActive: number })[] = await this.dataSource.query(
      'SELECT id, sku, size, stock, isActive FROM product_variants WHERE productId = ? AND isActive = 1 ORDER BY id ASC',
      [productId],
    );
    return rows.map((row) => ({ ...row, isActive: toBool(row.isActive) }));
  }

  async findGemstones(productId: number): Promise<GemstoneRow[]> {
    const rows: (Omit<GemstoneRow, 'carat'> & { carat: string | null })[] = await this.dataSource.query(
      `SELECT pg.id, pg.gemstoneId, g.name, pg.quantity, pg.carat, pg.color, pg.clarity, pg.cut
       FROM product_gemstones pg JOIN gemstones g ON g.id = pg.gemstoneId
       WHERE pg.productId = ? ORDER BY pg.id ASC`,
      [productId],
    );
    return rows.map((row) => ({ ...row, carat: row.carat == null ? null : Number(row.carat) }));
  }

  /** Số biến thể đang bán + id nhỏ nhất của mỗi sản phẩm, một truy vấn cho cả trang. */
  private async findVariantSummaries(productIds: number[]): Promise<Map<number, { count: number; minId: number }>> {
    const result = new Map<number, { count: number; minId: number }>();
    if (!productIds.length) return result;
    const rows: { productId: number; n: string; minId: number }[] = await this.dataSource.query(
      'SELECT productId, COUNT(*) AS n, MIN(id) AS minId FROM product_variants WHERE productId IN (?) AND isActive = 1 GROUP BY productId',
      [productIds],
    );
    for (const row of rows) result.set(row.productId, { count: Number(row.n), minId: row.minId });
    return result;
  }

  async findPrimaryImageUrls(productIds: number[]): Promise<Map<number, string>> {
    const result = new Map<number, string>();
    if (!productIds.length) return result;
    const rows: { productId: number; url: string }[] = await this.dataSource.query(
      `SELECT productId, url FROM product_images WHERE productId IN (?)
       ORDER BY productId, isPrimary DESC, sortOrder ASC, id ASC`,
      [productIds],
    );
    for (const row of rows) if (!result.has(row.productId)) result.set(row.productId, row.url);
    return result;
  }

  private buildWhere(filter: ProductListFilter): { where: string; params: unknown[] } {
    const conditions = ['p.isActive = 1', 'p.categoryId IN (?)'];
    const params: unknown[] = [filter.categoryIds];

    if (filter.collectionId !== undefined) {
      conditions.push('p.collectionId = ?');
      params.push(filter.collectionId);
    }
    if (filter.materialId !== undefined) {
      conditions.push('p.materialId = ?');
      params.push(filter.materialId);
    }
    if (filter.gemstoneIds?.length) {
      conditions.push('EXISTS (SELECT 1 FROM product_gemstones g WHERE g.productId = p.id AND g.gemstoneId IN (?))');
      params.push(filter.gemstoneIds);
    }
    if (filter.targetGroups?.length) {
      conditions.push('p.targetGroup IN (?)');
      params.push(filter.targetGroups);
    }
    if (filter.minPrice !== undefined) {
      conditions.push(`${EFFECTIVE_PRICE} >= ?`);
      params.push(filter.minPrice);
    }
    if (filter.maxPrice !== undefined) {
      conditions.push(`${EFFECTIVE_PRICE} <= ?`);
      params.push(filter.maxPrice);
    }
    if (filter.q) {
      conditions.push('(p.name LIKE ? OR p.code LIKE ?)');
      const pattern = `%${escapeLike(filter.q)}%`;
      params.push(pattern, pattern);
    }
    if (filter.inStock) conditions.push(IN_STOCK_EXISTS);
    if (filter.onSale) conditions.push('pr.discountPercent IS NOT NULL');
    if (filter.featured) conditions.push('p.isFeatured = 1');
    if (filter.excludeProductId !== undefined) {
      conditions.push('p.id <> ?');
      params.push(filter.excludeProductId);
    }
    return { where: conditions.join(' AND '), params };
  }
}
