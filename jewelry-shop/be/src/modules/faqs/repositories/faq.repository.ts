import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';

export interface FaqRow {
  id: number;
  question: string;
  answer: string;
  keywords: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface FaqWrite {
  question?: string;
  answer?: string;
  keywords?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

type RawFaq = Omit<FaqRow, 'isActive'> & { isActive: number };
const COLUMNS = 'id, question, answer, keywords, sortOrder, isActive';
const toRow = (row: RawFaq): FaqRow => ({ ...row, isActive: toBool(row.isActive) });

@Injectable()
export class FaqRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findActive(): Promise<FaqRow[]> {
    const rows: RawFaq[] = await this.dataSource.query(
      `SELECT ${COLUMNS} FROM faqs WHERE isActive = 1 ORDER BY sortOrder ASC, id ASC`,
    );
    return rows.map(toRow);
  }

  async findAll(): Promise<FaqRow[]> {
    const rows: RawFaq[] = await this.dataSource.query(`SELECT ${COLUMNS} FROM faqs ORDER BY sortOrder ASC, id ASC`);
    return rows.map(toRow);
  }

  async findById(id: number): Promise<FaqRow | null> {
    const rows: RawFaq[] = await this.dataSource.query(`SELECT ${COLUMNS} FROM faqs WHERE id = ?`, [id]);
    return rows[0] ? toRow(rows[0]) : null;
  }

  async insert(data: Required<Pick<FaqWrite, 'question' | 'answer'>> & FaqWrite): Promise<number> {
    const result: { insertId: number } = await this.dataSource.query(
      'INSERT INTO faqs (question, answer, keywords, sortOrder, isActive) VALUES (?, ?, ?, ?, ?)',
      [data.question, data.answer, data.keywords ?? null, data.sortOrder ?? 0, data.isActive === false ? 0 : 1],
    );
    return result.insertId;
  }

  async update(id: number, data: FaqWrite): Promise<void> {
    const sets: string[] = [];
    const params: unknown[] = [];
    const add = (column: string, value: unknown) => {
      sets.push(`${column} = ?`);
      params.push(value);
    };
    if (data.question !== undefined) add('question', data.question);
    if (data.answer !== undefined) add('answer', data.answer);
    if (data.keywords !== undefined) add('keywords', data.keywords);
    if (data.sortOrder !== undefined) add('sortOrder', data.sortOrder);
    if (data.isActive !== undefined) add('isActive', data.isActive ? 1 : 0);
    if (!sets.length) return;
    await this.dataSource.query(`UPDATE faqs SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  }

  async delete(id: number): Promise<void> {
    await this.dataSource.query('DELETE FROM faqs WHERE id = ?', [id]);
  }
}
