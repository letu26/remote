import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';

export interface ArticleListRow {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
}

export interface AdminArticleListRow extends ArticleListRow {
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleRow extends AdminArticleListRow {
  content: string;
  thumbnailPublicId: string | null;
  authorId: number | null;
}

export interface ArticleWrite {
  title?: string;
  slug?: string;
  summary?: string | null;
  content?: string;
  thumbnailUrl?: string | null;
  thumbnailPublicId?: string | null;
  authorId?: number | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
}

type WithPublished<T> = Omit<T, 'isPublished'> & { isPublished: number };

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');
const LIST_COLUMNS = 'id, title, slug, summary, thumbnailUrl, publishedAt';
const ADMIN_COLUMNS = `${LIST_COLUMNS}, isPublished, createdAt, updatedAt`;
const FULL_COLUMNS = `${ADMIN_COLUMNS}, content, thumbnailPublicId, authorId`;
const PUBLISHED_WHERE = 'isPublished = 1 AND publishedAt IS NOT NULL AND publishedAt <= ?';

@Injectable()
export class ArticleRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findPublishedPage(
    q: string | undefined,
    limit: number,
    offset: number,
    now: Date,
  ): Promise<{ rows: ArticleListRow[]; total: number }> {
    const search = q ? ' AND (title LIKE ? OR summary LIKE ?)' : '';
    const searchParams = q ? [`%${escapeLike(q)}%`, `%${escapeLike(q)}%`] : [];
    const params = [now, ...searchParams];
    const [countRows, rows]: [{ total: string }[], ArticleListRow[]] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM articles WHERE ${PUBLISHED_WHERE}${search}`, params),
      this.dataSource.query(
        `SELECT ${LIST_COLUMNS} FROM articles WHERE ${PUBLISHED_WHERE}${search}
         ORDER BY publishedAt DESC, id DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
    ]);
    return { rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findPublishedBySlug(slug: string, now: Date): Promise<ArticleRow | null> {
    const rows: WithPublished<ArticleRow>[] = await this.dataSource.query(
      `SELECT ${FULL_COLUMNS} FROM articles WHERE slug = ? AND ${PUBLISHED_WHERE} LIMIT 1`,
      [slug, now],
    );
    return rows[0] ? { ...rows[0], isPublished: toBool(rows[0].isPublished) } : null;
  }

  findRelated(excludeId: number, limit: number, now: Date): Promise<ArticleListRow[]> {
    return this.dataSource.query(
      `SELECT ${LIST_COLUMNS} FROM articles WHERE ${PUBLISHED_WHERE} AND id <> ?
       ORDER BY publishedAt DESC, id DESC LIMIT ?`,
      [now, excludeId, limit],
    );
  }

  async findAdminPage(
    q: string | undefined,
    published: boolean | undefined,
    limit: number,
    offset: number,
  ): Promise<{ rows: AdminArticleListRow[]; total: number }> {
    const conditions = ['1 = 1'];
    const params: unknown[] = [];
    if (q) {
      conditions.push('(title LIKE ? OR summary LIKE ?)');
      params.push(`%${escapeLike(q)}%`, `%${escapeLike(q)}%`);
    }
    if (published !== undefined) {
      conditions.push('isPublished = ?');
      params.push(published ? 1 : 0);
    }
    const where = conditions.join(' AND ');
    const [countRows, rows]: [{ total: string }[], WithPublished<AdminArticleListRow>[]] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM articles WHERE ${where}`, params),
      this.dataSource.query(
        `SELECT ${ADMIN_COLUMNS} FROM articles WHERE ${where} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
    ]);
    return {
      total: Number(countRows[0]?.total ?? 0),
      rows: rows.map((row) => ({ ...row, isPublished: toBool(row.isPublished) })),
    };
  }

  async findById(id: number): Promise<ArticleRow | null> {
    const rows: WithPublished<ArticleRow>[] = await this.dataSource.query(
      `SELECT ${FULL_COLUMNS} FROM articles WHERE id = ?`,
      [id],
    );
    return rows[0] ? { ...rows[0], isPublished: toBool(rows[0].isPublished) } : null;
  }

  async findSlugsStartingWith(prefix: string): Promise<string[]> {
    const rows: { slug: string }[] = await this.dataSource.query(
      'SELECT slug FROM articles WHERE slug = ? OR slug LIKE ?',
      [prefix, `${escapeLike(prefix)}-%`],
    );
    return rows.map((row) => row.slug);
  }

  async insert(data: Required<Pick<ArticleWrite, 'title' | 'slug' | 'content'>> & ArticleWrite): Promise<number> {
    const result: { insertId: number } = await this.dataSource.query(
      `INSERT INTO articles (title, slug, summary, content, thumbnailUrl, thumbnailPublicId, authorId, isPublished, publishedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.slug,
        data.summary ?? null,
        data.content,
        data.thumbnailUrl ?? null,
        data.thumbnailPublicId ?? null,
        data.authorId ?? null,
        data.isPublished ? 1 : 0,
        data.publishedAt ?? null,
      ],
    );
    return result.insertId;
  }

  async update(id: number, data: ArticleWrite): Promise<void> {
    const sets: string[] = [];
    const params: unknown[] = [];
    const add = (column: string, value: unknown) => {
      sets.push(`${column} = ?`);
      params.push(value);
    };
    if (data.title !== undefined) add('title', data.title);
    if (data.slug !== undefined) add('slug', data.slug);
    if (data.summary !== undefined) add('summary', data.summary);
    if (data.content !== undefined) add('content', data.content);
    if (data.thumbnailUrl !== undefined) add('thumbnailUrl', data.thumbnailUrl);
    if (data.thumbnailPublicId !== undefined) add('thumbnailPublicId', data.thumbnailPublicId);
    if (data.isPublished !== undefined) add('isPublished', data.isPublished ? 1 : 0);
    if (data.publishedAt !== undefined) add('publishedAt', data.publishedAt);
    if (!sets.length) return;
    await this.dataSource.query(`UPDATE articles SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  }

  async delete(id: number): Promise<void> {
    await this.dataSource.query('DELETE FROM articles WHERE id = ?', [id]);
  }
}
