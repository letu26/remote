import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';

export interface BannerRow {
  id: number;
  title: string;
  imageUrl: string;
  imagePublicId: string | null;
  linkUrl: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface BannerWrite {
  title?: string;
  imageUrl?: string;
  imagePublicId?: string | null;
  linkUrl?: string | null;
  position?: string;
  sortOrder?: number;
  isActive?: boolean;
}

type RawBanner = Omit<BannerRow, 'isActive'> & { isActive: number };

const COLUMNS = 'id, title, imageUrl, imagePublicId, linkUrl, position, sortOrder, isActive, createdAt';
const toRow = (row: RawBanner): BannerRow => ({ ...row, isActive: toBool(row.isActive) });

@Injectable()
export class BannerRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findActive(position?: string): Promise<BannerRow[]> {
    const rows: RawBanner[] = await this.dataSource.query(
      `SELECT ${COLUMNS} FROM banners WHERE isActive = 1 ${position ? 'AND position = ?' : ''} ORDER BY sortOrder ASC, id ASC`,
      position ? [position] : [],
    );
    return rows.map(toRow);
  }

  async findAll(): Promise<BannerRow[]> {
    const rows: RawBanner[] = await this.dataSource.query(
      `SELECT ${COLUMNS} FROM banners ORDER BY position ASC, sortOrder ASC, id ASC`,
    );
    return rows.map(toRow);
  }

  async findById(id: number): Promise<BannerRow | null> {
    const rows: RawBanner[] = await this.dataSource.query(`SELECT ${COLUMNS} FROM banners WHERE id = ?`, [id]);
    return rows[0] ? toRow(rows[0]) : null;
  }

  async insert(data: Required<Pick<BannerWrite, 'title' | 'imageUrl' | 'position'>> & BannerWrite): Promise<number> {
    const result: { insertId: number } = await this.dataSource.query(
      `INSERT INTO banners (title, imageUrl, imagePublicId, linkUrl, position, sortOrder, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.imageUrl,
        data.imagePublicId ?? null,
        data.linkUrl ?? null,
        data.position,
        data.sortOrder ?? 0,
        data.isActive === false ? 0 : 1,
      ],
    );
    return result.insertId;
  }

  async update(id: number, data: BannerWrite): Promise<void> {
    const sets: string[] = [];
    const params: unknown[] = [];
    const add = (column: string, value: unknown) => {
      sets.push(`${column} = ?`);
      params.push(value);
    };
    if (data.title !== undefined) add('title', data.title);
    if (data.imageUrl !== undefined) add('imageUrl', data.imageUrl);
    if (data.imagePublicId !== undefined) add('imagePublicId', data.imagePublicId);
    if (data.linkUrl !== undefined) add('linkUrl', data.linkUrl);
    if (data.position !== undefined) add('position', data.position);
    if (data.sortOrder !== undefined) add('sortOrder', data.sortOrder);
    if (data.isActive !== undefined) add('isActive', data.isActive ? 1 : 0);
    if (!sets.length) return;
    await this.dataSource.query(`UPDATE banners SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  }

  async delete(id: number): Promise<void> {
    await this.dataSource.query('DELETE FROM banners WHERE id = ?', [id]);
  }
}
