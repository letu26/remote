import { toBool } from '../../../utils/db-error.util.js';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProductImage } from '../../catalog/models/product-image.entity.js';

export interface ImageRecord {
  id: number;
  url: string;
  publicId: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface NewImage {
  url: string;
  publicId: string;
}

export type AddImagesResult = { ok: true; images: ImageRecord[] } | { ok: false; reason: 'limit' | 'product_missing' };

interface RawImageRow extends Omit<ImageRecord, 'isPrimary'> {
  isPrimary: number;
}

const toRecord = (row: RawImageRow): ImageRecord => ({ ...row, isPrimary: toBool(row.isPrimary) });

/** Mọi thao tác ghi khóa dòng sản phẩm trong transaction để cờ ảnh đại diện và số lượng ảnh luôn nhất quán. */
@Injectable()
export class ProductImageRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async productExists(productId: number): Promise<boolean> {
    const rows: unknown[] = await this.dataSource.query('SELECT 1 FROM products WHERE id = ? LIMIT 1', [productId]);
    return rows.length > 0;
  }

  async countByProduct(productId: number): Promise<number> {
    const rows: { total: string }[] = await this.dataSource.query(
      'SELECT COUNT(*) AS total FROM product_images WHERE productId = ?',
      [productId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async findByProduct(productId: number): Promise<ImageRecord[]> {
    const rows: RawImageRow[] = await this.dataSource.query(
      'SELECT id, url, publicId, isPrimary, sortOrder FROM product_images WHERE productId = ? ORDER BY sortOrder ASC, id ASC',
      [productId],
    );
    return rows.map(toRecord);
  }

  async findOne(productId: number, imageId: number): Promise<ImageRecord | null> {
    const rows: RawImageRow[] = await this.dataSource.query(
      'SELECT id, url, publicId, isPrimary, sortOrder FROM product_images WHERE id = ? AND productId = ?',
      [imageId, productId],
    );
    return rows[0] ? toRecord(rows[0]) : null;
  }

  addAll(productId: number, uploaded: NewImage[], maxImages: number): Promise<AddImagesResult> {
    return this.dataSource.transaction(async (manager) => {
      const locked: unknown[] = await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
      if (!locked.length) return { ok: false, reason: 'product_missing' } as const;

      const stats: { total: string; maxOrder: string | null; primaries: string }[] = await manager.query(
        `SELECT COUNT(*) AS total, MAX(sortOrder) AS maxOrder, COALESCE(SUM(isPrimary), 0) AS primaries
         FROM product_images WHERE productId = ?`,
        [productId],
      );
      const total = Number(stats[0].total);
      if (total + uploaded.length > maxImages) return { ok: false, reason: 'limit' } as const;

      let nextOrder = stats[0].maxOrder == null ? 0 : Number(stats[0].maxOrder) + 1;
      const needsPrimary = Number(stats[0].primaries) === 0;
      const saved = await manager.save(
        ProductImage,
        uploaded.map((item, index) =>
          manager.create(ProductImage, {
            productId,
            url: item.url,
            publicId: item.publicId,
            sortOrder: nextOrder++,
            isPrimary: needsPrimary && index === 0,
          }),
        ),
      );
      return {
        ok: true,
        images: saved.map((row) => ({
          id: row.id,
          url: row.url,
          publicId: row.publicId,
          isPrimary: row.isPrimary,
          sortOrder: row.sortOrder,
        })),
      } as const;
    });
  }

  /** Đặt ảnh đại diện (bỏ cờ ảnh khác) và/hoặc sortOrder. */
  update(productId: number, imageId: number, data: { isPrimary?: boolean; sortOrder?: number }): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
      if (data.sortOrder !== undefined) {
        await manager.query('UPDATE product_images SET sortOrder = ? WHERE id = ? AND productId = ?', [
          data.sortOrder,
          imageId,
          productId,
        ]);
      }
      if (data.isPrimary === true) {
        await manager.query('UPDATE product_images SET isPrimary = (id = ?) WHERE productId = ?', [imageId, productId]);
      }
    });
  }

  reorder(productId: number, orderedIds: number[]): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
      for (const [index, imageId] of orderedIds.entries()) {
        await manager.query('UPDATE product_images SET sortOrder = ? WHERE id = ? AND productId = ?', [
          index,
          imageId,
          productId,
        ]);
      }
    });
  }

  /** Xóa dòng ảnh; nếu là ảnh đại diện thì ảnh còn lại đầu tiên (theo sortOrder) lên thay. */
  remove(productId: number, imageId: number): Promise<{ publicId: string | null } | null> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
      const rows: { publicId: string | null; isPrimary: number }[] = await manager.query(
        'SELECT publicId, isPrimary FROM product_images WHERE id = ? AND productId = ?',
        [imageId, productId],
      );
      if (!rows.length) return null;
      await manager.query('DELETE FROM product_images WHERE id = ? AND productId = ?', [imageId, productId]);
      if (rows[0].isPrimary) {
        await manager.query(
          `UPDATE product_images SET isPrimary = 1 WHERE productId = ?
           ORDER BY sortOrder ASC, id ASC LIMIT 1`,
          [productId],
        );
      }
      return { publicId: rows[0].publicId };
    });
  }
}
