import { toBool } from '../../../utils/db-error.util.js';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export type LookupKind = 'materials' | 'gemstones';

/** Tên bảng/cột lấy từ danh sách cố định này, không bao giờ từ input người dùng. */
const LOOKUP_TABLES = {
  materials: { table: 'materials', usageTable: 'products', usageColumn: 'materialId', productIdColumn: 'id' },
  gemstones: { table: 'gemstones', usageTable: 'product_gemstones', usageColumn: 'gemstoneId', productIdColumn: 'productId' },
} as const;

export interface LookupAdminRow {
  id: number;
  name: string;
  isActive: boolean;
  productCount: number;
}

interface RawLookupRow {
  id: number;
  name: string;
  isActive: number;
  productCount: string;
}

const toRow = (row: RawLookupRow): LookupAdminRow => ({
  id: row.id,
  name: row.name,
  isActive: toBool(row.isActive),
  productCount: Number(row.productCount),
});

/** Chất liệu và loại đá có cùng cấu trúc (name + isActive) nên dùng chung một repository. */
@Injectable()
export class LookupAdminRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findAll(kind: LookupKind): Promise<LookupAdminRow[]> {
    const { table, usageTable, usageColumn, productIdColumn } = LOOKUP_TABLES[kind];
    const rows: RawLookupRow[] = await this.dataSource.query(
      `SELECT t.id, t.name, t.isActive,
              (SELECT COUNT(DISTINCT u.${productIdColumn}) FROM ${usageTable} u WHERE u.${usageColumn} = t.id) AS productCount
       FROM ${table} t ORDER BY t.name ASC`,
    );
    return rows.map(toRow);
  }

  async findById(kind: LookupKind, id: number): Promise<LookupAdminRow | null> {
    const { table, usageTable, usageColumn, productIdColumn } = LOOKUP_TABLES[kind];
    const rows: RawLookupRow[] = await this.dataSource.query(
      `SELECT t.id, t.name, t.isActive,
              (SELECT COUNT(DISTINCT u.${productIdColumn}) FROM ${usageTable} u WHERE u.${usageColumn} = t.id) AS productCount
       FROM ${table} t WHERE t.id = ?`,
      [id],
    );
    return rows[0] ? toRow(rows[0]) : null;
  }

  async insert(kind: LookupKind, name: string, isActive: boolean): Promise<number> {
    const result: { insertId: number } = await this.dataSource.query(
      `INSERT INTO ${LOOKUP_TABLES[kind].table} (name, isActive) VALUES (?, ?)`,
      [name, isActive ? 1 : 0],
    );
    return result.insertId;
  }

  async update(kind: LookupKind, id: number, data: { name?: string; isActive?: boolean }): Promise<void> {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.name !== undefined) {
      sets.push('name = ?');
      params.push(data.name);
    }
    if (data.isActive !== undefined) {
      sets.push('isActive = ?');
      params.push(data.isActive ? 1 : 0);
    }
    if (!sets.length) return;
    await this.dataSource.query(`UPDATE ${LOOKUP_TABLES[kind].table} SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  }

  async delete(kind: LookupKind, id: number): Promise<void> {
    await this.dataSource.query(`DELETE FROM ${LOOKUP_TABLES[kind].table} WHERE id = ?`, [id]);
  }
}
