import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';
import type { PromotionStatus } from '../services/promotion-status.js';

export interface PromotionRow {
  id: number;
  name: string;
  productId: number;
  productCode: string;
  productName: string;
  discountPercent: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface PromotionFilter {
  q?: string;
  status?: PromotionStatus;
  productId?: number;
}

export interface NewPromotion {
  name: string;
  productIds: number[];
  discountPercent: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}

export interface PromotionWrite {
  name?: string;
  discountPercent?: number;
  startsAt?: Date;
  endsAt?: Date;
  isActive?: boolean;
}

type RawRow = Omit<PromotionRow, 'isActive'> & { isActive: number };

const SELECT_ROWS = `
  SELECT pr.id, pr.name, pr.productId, p.code AS productCode, p.name AS productName, pr.discountPercent,
         pr.startsAt, pr.endsAt, pr.isActive, pr.createdAt
  FROM promotions pr JOIN products p ON p.id = pr.productId`;

const toRow = (row: RawRow): PromotionRow => ({ ...row, isActive: toBool(row.isActive) });
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

/** Điều kiện SQL cho từng trạng thái: phải khớp computePromotionStatus (disabled > expired > upcoming > active). */
const STATUS_CONDITIONS: Record<PromotionStatus, string> = {
  disabled: 'pr.isActive = 0',
  expired: 'pr.isActive = 1 AND pr.endsAt < ?',
  upcoming: 'pr.isActive = 1 AND pr.endsAt >= ? AND pr.startsAt > ?',
  active: 'pr.isActive = 1 AND pr.endsAt >= ? AND pr.startsAt <= ?',
};
const STATUS_PARAM_COUNT: Record<PromotionStatus, number> = { disabled: 0, expired: 1, upcoming: 2, active: 2 };

@Injectable()
export class PromotionAdminRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findPage(
    filter: PromotionFilter,
    limit: number,
    offset: number,
    now: Date,
  ): Promise<{ rows: PromotionRow[]; total: number }> {
    const conditions = ['1 = 1'];
    const params: unknown[] = [];
    if (filter.q) {
      const pattern = `%${escapeLike(filter.q)}%`;
      conditions.push('(pr.name LIKE ? OR p.name LIKE ? OR p.code LIKE ?)');
      params.push(pattern, pattern, pattern);
    }
    if (filter.productId !== undefined) {
      conditions.push('pr.productId = ?');
      params.push(filter.productId);
    }
    if (filter.status) {
      conditions.push(`(${STATUS_CONDITIONS[filter.status]})`);
      for (let i = 0; i < STATUS_PARAM_COUNT[filter.status]; i += 1) params.push(now);
    }
    const where = conditions.join(' AND ');
    const [countRows, rows]: [{ total: string }[], RawRow[]] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM promotions pr JOIN products p ON p.id = pr.productId WHERE ${where}`, params),
      this.dataSource.query(`${SELECT_ROWS} WHERE ${where} ORDER BY pr.createdAt DESC, pr.id DESC LIMIT ? OFFSET ?`, [
        ...params,
        limit,
        offset,
      ]),
    ]);
    return { total: Number(countRows[0]?.total ?? 0), rows: rows.map(toRow) };
  }

  async findByIds(ids: number[]): Promise<PromotionRow[]> {
    if (!ids.length) return [];
    const rows: RawRow[] = await this.dataSource.query(`${SELECT_ROWS} WHERE pr.id IN (?) ORDER BY pr.id ASC`, [ids]);
    return rows.map(toRow);
  }

  async findById(id: number): Promise<PromotionRow | null> {
    return (await this.findByIds([id]))[0] ?? null;
  }

  async findExistingProductIds(ids: number[]): Promise<Set<number>> {
    const rows: { id: number }[] = await this.dataSource.query('SELECT id FROM products WHERE id IN (?)', [ids]);
    return new Set(rows.map((row) => row.id));
  }

  /** Tạo một khuyến mại cho mỗi sản phẩm trong MỘT transaction; trả về id các dòng đã tạo. */
  create(data: NewPromotion): Promise<number[]> {
    return this.dataSource.transaction(async (manager) => {
      const ids: number[] = [];
      for (const productId of data.productIds) {
        const result: { insertId: number } = await manager.query(
          'INSERT INTO promotions (name, productId, discountPercent, startsAt, endsAt, isActive) VALUES (?, ?, ?, ?, ?, ?)',
          [data.name, productId, data.discountPercent, data.startsAt, data.endsAt, data.isActive ? 1 : 0],
        );
        ids.push(result.insertId);
      }
      return ids;
    });
  }

  async update(id: number, data: PromotionWrite): Promise<void> {
    const sets: string[] = [];
    const params: unknown[] = [];
    const add = (column: string, value: unknown) => {
      sets.push(`${column} = ?`);
      params.push(value);
    };
    if (data.name !== undefined) add('name', data.name);
    if (data.discountPercent !== undefined) add('discountPercent', data.discountPercent);
    if (data.startsAt !== undefined) add('startsAt', data.startsAt);
    if (data.endsAt !== undefined) add('endsAt', data.endsAt);
    if (data.isActive !== undefined) add('isActive', data.isActive ? 1 : 0);
    if (!sets.length) return;
    await this.dataSource.query(`UPDATE promotions SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  }

  async delete(id: number): Promise<void> {
    await this.dataSource.query('DELETE FROM promotions WHERE id = ?', [id]);
  }
}
