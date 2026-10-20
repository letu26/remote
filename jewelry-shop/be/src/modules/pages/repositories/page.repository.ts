import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';

export interface PageRow {
  id: number;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
  updatedAt: Date;
}

export interface PageWrite {
  slug?: string;
  title?: string;
  content?: string;
  isActive?: boolean;
}

type RawPage = Omit<PageRow, 'isActive'> & { isActive: number };
const COLUMNS = 'id, slug, title, content, isActive, updatedAt';
const toRow = (row: RawPage): PageRow => ({ ...row, isActive: toBool(row.isActive) });

@Injectable()
export class PageRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  findActiveSummaries(): Promise<{ slug: string; title: string }[]> {
    return this.dataSource.query('SELECT slug, title FROM pages WHERE isActive = 1 ORDER BY title ASC, id ASC');
  }

  async findActiveBySlug(slug: string): Promise<PageRow | null> {
    const rows: RawPage[] = await this.dataSource.query(
      `SELECT ${COLUMNS} FROM pages WHERE slug = ? AND isActive = 1 LIMIT 1`,
      [slug],
    );
    return rows[0] ? toRow(rows[0]) : null;
  }

  async findAll(): Promise<PageRow[]> {
    const rows: RawPage[] = await this.dataSource.query(`SELECT ${COLUMNS} FROM pages ORDER BY title ASC, id ASC`);
    return rows.map(toRow);
  }

  async findById(id: number): Promise<PageRow | null> {
    const rows: RawPage[] = await this.dataSource.query(`SELECT ${COLUMNS} FROM pages WHERE id = ?`, [id]);
    return rows[0] ? toRow(rows[0]) : null;
  }

  async insert(data: Required<Pick<PageWrite, 'slug' | 'title' | 'content'>> & PageWrite): Promise<number> {
    const result: { insertId: number } = await this.dataSource.query(
      'INSERT INTO pages (slug, title, content, isActive) VALUES (?, ?, ?, ?)',
      [data.slug, data.title, data.content, data.isActive === false ? 0 : 1],
    );
    return result.insertId;
  }

  async update(id: number, data: PageWrite): Promise<void> {
    const sets: string[] = [];
    const params: unknown[] = [];
    const add = (column: string, value: unknown) => {
      sets.push(`${column} = ?`);
      params.push(value);
    };
    if (data.slug !== undefined) add('slug', data.slug);
    if (data.title !== undefined) add('title', data.title);
    if (data.content !== undefined) add('content', data.content);
    if (data.isActive !== undefined) add('isActive', data.isActive ? 1 : 0);
    if (!sets.length) return;
    await this.dataSource.query(`UPDATE pages SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  }

  async delete(id: number): Promise<void> {
    await this.dataSource.query('DELETE FROM pages WHERE id = ?', [id]);
  }
}
