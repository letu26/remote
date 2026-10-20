import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';

export interface ShippingMethodRow {
  id: number;
  name: string;
  description: string | null;
  fee: number;
  isActive: boolean;
}

interface RawRow extends Omit<ShippingMethodRow, 'fee' | 'isActive'> {
  fee: string;
  isActive: number;
}

const toRow = (row: RawRow): ShippingMethodRow => ({ ...row, fee: Number(row.fee), isActive: toBool(row.isActive) });

@Injectable()
export class ShippingMethodRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findAll(onlyActive: boolean): Promise<ShippingMethodRow[]> {
    const rows: RawRow[] = await this.dataSource.query(
      `SELECT id, name, description, fee, isActive FROM shipping_methods ${onlyActive ? 'WHERE isActive = 1' : ''} ORDER BY fee ASC, id ASC`,
    );
    return rows.map(toRow);
  }

  async findById(id: number): Promise<ShippingMethodRow | null> {
    const rows: RawRow[] = await this.dataSource.query(
      'SELECT id, name, description, fee, isActive FROM shipping_methods WHERE id = ?',
      [id],
    );
    return rows[0] ? toRow(rows[0]) : null;
  }

  async insert(data: { name: string; description: string | null; fee: number; isActive: boolean }): Promise<number> {
    const result: { insertId: number } = await this.dataSource.query(
      'INSERT INTO shipping_methods (name, description, fee, isActive) VALUES (?, ?, ?, ?)',
      [data.name, data.description, data.fee, data.isActive ? 1 : 0],
    );
    return result.insertId;
  }

  async update(
    id: number,
    data: { name?: string; description?: string | null; fee?: number; isActive?: boolean },
  ): Promise<void> {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.name !== undefined) {
      sets.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      sets.push('description = ?');
      params.push(data.description);
    }
    if (data.fee !== undefined) {
      sets.push('fee = ?');
      params.push(data.fee);
    }
    if (data.isActive !== undefined) {
      sets.push('isActive = ?');
      params.push(data.isActive ? 1 : 0);
    }
    if (!sets.length) return;
    await this.dataSource.query(`UPDATE shipping_methods SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  }

  async countOrders(id: number): Promise<number> {
    const rows: { total: string }[] = await this.dataSource.query(
      'SELECT COUNT(*) AS total FROM orders WHERE shippingMethodId = ?',
      [id],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async delete(id: number): Promise<void> {
    await this.dataSource.query('DELETE FROM shipping_methods WHERE id = ?', [id]);
  }
}
