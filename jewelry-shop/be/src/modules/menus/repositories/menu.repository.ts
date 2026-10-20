import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, type EntityManager } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';

export interface MenuRow {
  id: number;
  label: string;
  url: string;
  parentId: number | null;
  placement: 'header' | 'footer';
  sortOrder: number;
  isActive: boolean;
}

export interface MenuWrite {
  label?: string;
  url?: string;
  parentId?: number | null;
  placement?: 'header' | 'footer';
  sortOrder?: number;
  isActive?: boolean;
}

/** Thao tác trong transaction khi đã khóa các dòng menu liên quan (SELECT ... FOR UPDATE). */
export interface MenuTransaction {
  /** Đọc (và khóa) một mục; null nếu không có. */
  lock(id: number): Promise<MenuRow | null>;
  countChildren(id: number): Promise<number>;
  insert(data: Required<Pick<MenuWrite, 'label' | 'url' | 'placement'>> & MenuWrite): Promise<number>;
  update(id: number, data: MenuWrite): Promise<void>;
  setChildrenPlacement(parentId: number, placement: 'header' | 'footer'): Promise<void>;
}

type RawMenu = Omit<MenuRow, 'isActive'> & { isActive: number };
const COLUMNS = 'id, label, url, parentId, placement, sortOrder, isActive';
const toRow = (row: RawMenu): MenuRow => ({ ...row, isActive: toBool(row.isActive) });

@Injectable()
export class MenuRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findActiveByPlacement(placement: string): Promise<MenuRow[]> {
    const rows: RawMenu[] = await this.dataSource.query(
      `SELECT ${COLUMNS} FROM menus WHERE placement = ? AND isActive = 1 ORDER BY sortOrder ASC, id ASC`,
      [placement],
    );
    return rows.map(toRow);
  }

  async findAll(): Promise<MenuRow[]> {
    const rows: RawMenu[] = await this.dataSource.query(
      `SELECT ${COLUMNS} FROM menus ORDER BY placement ASC, sortOrder ASC, id ASC`,
    );
    return rows.map(toRow);
  }

  async findById(id: number): Promise<MenuRow | null> {
    const rows: RawMenu[] = await this.dataSource.query(`SELECT ${COLUMNS} FROM menus WHERE id = ?`, [id]);
    return rows[0] ? toRow(rows[0]) : null;
  }

  /** Chạy `work` trong transaction. Service quyết định nghiệp vụ, repository chỉ cung cấp thao tác dữ liệu. */
  runInTransaction<T>(work: (tx: MenuTransaction) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) => work(this.createTransaction(manager)));
  }

  async countChildren(id: number): Promise<number> {
    const rows: { total: string }[] = await this.dataSource.query(
      'SELECT COUNT(*) AS total FROM menus WHERE parentId = ?',
      [id],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async delete(id: number): Promise<void> {
    await this.dataSource.query('DELETE FROM menus WHERE id = ?', [id]);
  }

  private createTransaction(manager: EntityManager): MenuTransaction {
    return {
      lock: async (id) => {
        const rows: RawMenu[] = await manager.query(`SELECT ${COLUMNS} FROM menus WHERE id = ? FOR UPDATE`, [id]);
        return rows[0] ? toRow(rows[0]) : null;
      },
      countChildren: async (id) => {
        const rows: { total: string }[] = await manager.query('SELECT COUNT(*) AS total FROM menus WHERE parentId = ? FOR UPDATE', [id]);
        return Number(rows[0]?.total ?? 0);
      },
      insert: async (data) => {
        const result: { insertId: number } = await manager.query(
          'INSERT INTO menus (label, url, parentId, placement, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, ?)',
          [data.label, data.url, data.parentId ?? null, data.placement, data.sortOrder ?? 0, data.isActive === false ? 0 : 1],
        );
        return result.insertId;
      },
      update: async (id, data) => {
        const sets: string[] = [];
        const params: unknown[] = [];
        const add = (column: string, value: unknown) => {
          sets.push(`${column} = ?`);
          params.push(value);
        };
        if (data.label !== undefined) add('label', data.label);
        if (data.url !== undefined) add('url', data.url);
        if (data.parentId !== undefined) add('parentId', data.parentId);
        if (data.placement !== undefined) add('placement', data.placement);
        if (data.sortOrder !== undefined) add('sortOrder', data.sortOrder);
        if (data.isActive !== undefined) add('isActive', data.isActive ? 1 : 0);
        if (!sets.length) return;
        await manager.query(`UPDATE menus SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
      },
      setChildrenPlacement: async (parentId, placement) => {
        await manager.query('UPDATE menus SET placement = ? WHERE parentId = ?', [placement, parentId]);
      },
    };
  }
}
