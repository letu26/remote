import { toBool } from '../../../utils/db-error.util.js';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, type EntityManager } from 'typeorm';
import { ProductGemstone } from '../../catalog/models/product-gemstone.entity.js';
import { ProductVariant } from '../../catalog/models/product-variant.entity.js';
import { Product, type TargetGroup } from '../../catalog/models/product.entity.js';

export interface AdminProductListRow {
  id: number;
  code: string;
  name: string;
  slug: string;
  price: number;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  isFeatured: boolean;
  totalStock: number;
  primaryImageUrl: string | null;
  createdAt: Date;
}

export interface AdminProductFilter {
  q?: string;
  categoryId?: number;
  isActive?: boolean;
}

export interface ProductScalarWrite {
  code?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  categoryId?: number;
  materialId?: number | null;
  collectionId?: number | null;
  targetGroup?: TargetGroup;
  weight?: number | null;
  costPrice?: number;
  price?: number;
  warrantyInfo?: string | null;
  certificate?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface GemstoneWrite {
  gemstoneId: number;
  quantity: number;
  carat: number | null;
  color: string | null;
  clarity: string | null;
  cut: string | null;
}

export interface NewVariantWrite {
  sku: string;
  size: string;
  stock: number;
  isActive: boolean;
}

/** Kế hoạch đồng bộ biến thể do service tính; repository chỉ thi hành trong transaction. */
export interface VariantSyncPlan {
  update: { id: number; sku: string; size: string; isActive?: boolean }[];
  create: NewVariantWrite[];
  deactivateIds: number[];
}

export interface AdminVariantRow {
  id: number;
  sku: string;
  size: string;
  stock: number;
  isActive: boolean;
}

export interface AdminImageRow {
  id: number;
  url: string;
  publicId: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface AdminGemstoneRow {
  id: number;
  gemstoneId: number;
  name: string;
  quantity: number;
  carat: number | null;
  color: string | null;
  clarity: string | null;
  cut: string | null;
}

export interface AdminProductRow {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  materialId: number | null;
  collectionId: number | null;
  targetGroup: TargetGroup;
  weight: number | null;
  costPrice: number;
  price: number;
  warrantyInfo: string | null;
  certificate: string | null;
  isFeatured: boolean;
  isActive: boolean;
  soldCount: number;
  avgRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

type RawProductRow = Omit<AdminProductRow, 'price' | 'costPrice' | 'weight' | 'avgRating' | 'isActive' | 'isFeatured'> & {
  price: string;
  costPrice: string;
  weight: string | null;
  avgRating: string;
  isActive: number;
  isFeatured: number;
};

interface RawListRow {
  id: number;
  code: string;
  name: string;
  slug: string;
  price: string;
  categoryId: number;
  categoryName: string;
  isActive: number;
  isFeatured: number;
  createdAt: Date;
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class ProductAdminRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // ---------- Đọc ----------

  async findPage(
    filter: AdminProductFilter,
    limit: number,
    offset: number,
  ): Promise<{ rows: AdminProductListRow[]; total: number }> {
    const conditions: string[] = ['1 = 1'];
    const params: unknown[] = [];
    if (filter.q) {
      const pattern = `%${escapeLike(filter.q)}%`;
      conditions.push('(p.name LIKE ? OR p.code LIKE ?)');
      params.push(pattern, pattern);
    }
    if (filter.categoryId !== undefined) {
      conditions.push('p.categoryId = ?');
      params.push(filter.categoryId);
    }
    if (filter.isActive !== undefined) {
      conditions.push('p.isActive = ?');
      params.push(filter.isActive ? 1 : 0);
    }
    const where = conditions.join(' AND ');

    const [countRows, rows]: [{ total: string }[], RawListRow[]] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM products p WHERE ${where}`, params),
      this.dataSource.query(
        `SELECT p.id, p.code, p.name, p.slug, p.price, p.categoryId, c.name AS categoryName,
                p.isActive, p.isFeatured, p.createdAt
         FROM products p JOIN categories c ON c.id = p.categoryId
         WHERE ${where}
         ORDER BY p.createdAt DESC, p.id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
    ]);

    const ids = rows.map((row) => row.id);
    const [stocks, images] = await Promise.all([this.sumStockByProduct(ids), this.primaryImageUrlByProduct(ids)]);
    return {
      total: Number(countRows[0]?.total ?? 0),
      rows: rows.map((row) => ({
        ...row,
        price: Number(row.price),
        isActive: toBool(row.isActive),
        isFeatured: toBool(row.isFeatured),
        totalStock: stocks.get(row.id) ?? 0,
        primaryImageUrl: images.get(row.id) ?? null,
      })),
    };
  }

  async findById(id: number): Promise<AdminProductRow | null> {
    const rows: RawProductRow[] = await this.dataSource.query(
      `SELECT p.*, c.name AS categoryName FROM products p JOIN categories c ON c.id = p.categoryId WHERE p.id = ?`,
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      ...row,
      price: Number(row.price),
      costPrice: Number(row.costPrice),
      weight: row.weight == null ? null : Number(row.weight),
      avgRating: Number(row.avgRating),
      isActive: toBool(row.isActive),
      isFeatured: toBool(row.isFeatured),
      categoryName: row.categoryName,
    };
  }

  async exists(id: number): Promise<boolean> {
    const rows: unknown[] = await this.dataSource.query('SELECT 1 FROM products WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0;
  }

  async findSlugsStartingWith(prefix: string): Promise<string[]> {
    const rows: { slug: string }[] = await this.dataSource.query(
      'SELECT slug FROM products WHERE slug = ? OR slug LIKE ?',
      [prefix, `${escapeLike(prefix)}-%`],
    );
    return rows.map((row) => row.slug);
  }

  async findVariants(productId: number): Promise<AdminVariantRow[]> {
    const rows: (Omit<AdminVariantRow, 'isActive'> & { isActive: number })[] = await this.dataSource.query(
      'SELECT id, sku, size, stock, isActive FROM product_variants WHERE productId = ? ORDER BY id ASC',
      [productId],
    );
    return rows.map((row) => ({ ...row, isActive: toBool(row.isActive) }));
  }

  async findImages(productId: number): Promise<AdminImageRow[]> {
    const rows: (Omit<AdminImageRow, 'isPrimary'> & { isPrimary: number })[] = await this.dataSource.query(
      'SELECT id, url, publicId, isPrimary, sortOrder FROM product_images WHERE productId = ? ORDER BY sortOrder ASC, id ASC',
      [productId],
    );
    return rows.map((row) => ({ ...row, isPrimary: toBool(row.isPrimary) }));
  }

  async findGemstones(productId: number): Promise<AdminGemstoneRow[]> {
    const rows: (Omit<AdminGemstoneRow, 'carat'> & { carat: string | null })[] = await this.dataSource.query(
      `SELECT pg.id, pg.gemstoneId, g.name, pg.quantity, pg.carat, pg.color, pg.clarity, pg.cut
       FROM product_gemstones pg JOIN gemstones g ON g.id = pg.gemstoneId
       WHERE pg.productId = ? ORDER BY pg.id ASC`,
      [productId],
    );
    return rows.map((row) => ({ ...row, carat: row.carat == null ? null : Number(row.carat) }));
  }

  async categoryExists(id: number): Promise<boolean> {
    return this.existsIn('categories', id);
  }

  async materialExists(id: number): Promise<boolean> {
    return this.existsIn('materials', id);
  }

  async collectionExists(id: number): Promise<boolean> {
    return this.existsIn('collections', id);
  }

  /** Trong các id truyền vào, trả về những id gemstone có thật. */
  async findExistingGemstoneIds(ids: number[]): Promise<Set<number>> {
    if (!ids.length) return new Set();
    const rows: { id: number }[] = await this.dataSource.query('SELECT id FROM gemstones WHERE id IN (?)', [ids]);
    return new Set(rows.map((row) => row.id));
  }

  async hasOrderItems(productId: number): Promise<boolean> {
    const rows: unknown[] = await this.dataSource.query(
      `SELECT 1 FROM order_items oi JOIN product_variants v ON v.id = oi.variantId WHERE v.productId = ? LIMIT 1`,
      [productId],
    );
    return rows.length > 0;
  }

  // ---------- Ghi (mỗi hàm là một transaction) ----------

  create(
    scalars: Required<Pick<ProductScalarWrite, 'code' | 'name' | 'slug' | 'categoryId' | 'price'>> & ProductScalarWrite,
    gemstones: GemstoneWrite[],
    variants: NewVariantWrite[],
  ): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.save(
        manager.create(Product, {
          code: scalars.code,
          name: scalars.name,
          slug: scalars.slug,
          description: scalars.description ?? null,
          categoryId: scalars.categoryId,
          materialId: scalars.materialId ?? null,
          collectionId: scalars.collectionId ?? null,
          targetGroup: scalars.targetGroup,
          weight: scalars.weight ?? null,
          costPrice: scalars.costPrice ?? 0,
          price: scalars.price,
          warrantyInfo: scalars.warrantyInfo ?? null,
          certificate: scalars.certificate ?? null,
          isFeatured: scalars.isFeatured ?? false,
          isActive: scalars.isActive ?? true,
        }),
      );
      await this.insertGemstones(manager, product.id, gemstones);
      await this.insertVariants(manager, product.id, variants);
      return product.id;
    });
  }

  update(
    id: number,
    scalars: ProductScalarWrite,
    gemstones: GemstoneWrite[] | undefined,
    variantPlan: VariantSyncPlan | undefined,
  ): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      // Khóa dòng sản phẩm để hai lần sửa đồng thời không đan xen nhau.
      await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [id]);
      if (Object.keys(scalars).length) await manager.update(Product, { id }, scalars);

      if (gemstones) {
        await manager.delete(ProductGemstone, { productId: id });
        await this.insertGemstones(manager, id, gemstones);
      }
      if (variantPlan) {
        for (const item of variantPlan.update) {
          await manager.update(
            ProductVariant,
            { id: item.id, productId: id },
            { sku: item.sku, size: item.size, ...(item.isActive === undefined ? {} : { isActive: item.isActive }) },
          );
        }
        if (variantPlan.deactivateIds.length) {
          await manager.query('UPDATE product_variants SET isActive = 0 WHERE productId = ? AND id IN (?)', [
            id,
            variantPlan.deactivateIds,
          ]);
        }
        await this.insertVariants(manager, id, variantPlan.create);
      }
    });
  }

  /** Xóa sản phẩm và dữ liệu phụ thuộc; trả về publicId ảnh để xóa ở kho lưu trữ. */
  remove(id: number): Promise<string[]> {
    return this.dataSource.transaction(async (manager) => {
      const images: { publicId: string | null }[] = await manager.query(
        'SELECT publicId FROM product_images WHERE productId = ?',
        [id],
      );
      await manager.query(
        'DELETE FROM cart_items WHERE variantId IN (SELECT id FROM product_variants WHERE productId = ?)',
        [id],
      );
      await manager.query('DELETE FROM reviews WHERE productId = ?', [id]);
      await manager.query('DELETE FROM wishlists WHERE productId = ?', [id]);
      await manager.query('DELETE FROM promotions WHERE productId = ?', [id]);
      await manager.query('DELETE FROM product_gemstones WHERE productId = ?', [id]);
      await manager.query('DELETE FROM product_images WHERE productId = ?', [id]);
      await manager.query('DELETE FROM product_variants WHERE productId = ?', [id]);
      await manager.query('DELETE FROM products WHERE id = ?', [id]);
      return images.map((row) => row.publicId).filter((publicId): publicId is string => Boolean(publicId));
    });
  }

  // ---------- Tồn kho (một câu UPDATE nguyên tử) ----------

  async findVariant(productId: number, variantId: number): Promise<AdminVariantRow | null> {
    const rows: (Omit<AdminVariantRow, 'isActive'> & { isActive: number })[] = await this.dataSource.query(
      'SELECT id, sku, size, stock, isActive FROM product_variants WHERE id = ? AND productId = ?',
      [variantId, productId],
    );
    return rows[0] ? { ...rows[0], isActive: toBool(rows[0].isActive) } : null;
  }

  /** Cộng/trừ tồn kho; trả false nếu kết quả sẽ âm (không đổi gì). */
  async adjustStock(productId: number, variantId: number, delta: number): Promise<boolean> {
    const result: { affectedRows: number } = await this.dataSource.query(
      `UPDATE product_variants SET stock = CAST(stock AS SIGNED) + ?, version = version + 1
       WHERE id = ? AND productId = ? AND CAST(stock AS SIGNED) + ? >= 0`,
      [delta, variantId, productId, delta],
    );
    return result.affectedRows > 0;
  }

  async setStock(productId: number, variantId: number, stock: number): Promise<boolean> {
    const result: { affectedRows: number } = await this.dataSource.query(
      'UPDATE product_variants SET stock = ?, version = version + 1 WHERE id = ? AND productId = ?',
      [stock, variantId, productId],
    );
    return result.affectedRows > 0;
  }

  // ---------- Nội bộ ----------

  private async existsIn(table: 'categories' | 'materials' | 'collections', id: number): Promise<boolean> {
    const rows: unknown[] = await this.dataSource.query(`SELECT 1 FROM ${table} WHERE id = ? LIMIT 1`, [id]);
    return rows.length > 0;
  }

  private async insertGemstones(manager: EntityManager, productId: number, gemstones: GemstoneWrite[]): Promise<void> {
    if (!gemstones.length) return;
    await manager.save(
      ProductGemstone,
      gemstones.map((item) => manager.create(ProductGemstone, { ...item, productId })),
    );
  }

  private async insertVariants(manager: EntityManager, productId: number, variants: NewVariantWrite[]): Promise<void> {
    if (!variants.length) return;
    await manager.save(
      ProductVariant,
      variants.map((item) => manager.create(ProductVariant, { ...item, productId })),
    );
  }

  private async sumStockByProduct(productIds: number[]): Promise<Map<number, number>> {
    const result = new Map<number, number>();
    if (!productIds.length) return result;
    const rows: { productId: number; total: string }[] = await this.dataSource.query(
      'SELECT productId, SUM(stock) AS total FROM product_variants WHERE productId IN (?) GROUP BY productId',
      [productIds],
    );
    for (const row of rows) result.set(row.productId, Number(row.total));
    return result;
  }

  private async primaryImageUrlByProduct(productIds: number[]): Promise<Map<number, string>> {
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
}
