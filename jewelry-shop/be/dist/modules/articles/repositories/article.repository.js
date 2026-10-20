var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');
const LIST_COLUMNS = 'id, title, slug, summary, thumbnailUrl, publishedAt';
const ADMIN_COLUMNS = `${LIST_COLUMNS}, isPublished, createdAt, updatedAt`;
const FULL_COLUMNS = `${ADMIN_COLUMNS}, content, thumbnailPublicId, authorId`;
const PUBLISHED_WHERE = 'isPublished = 1 AND publishedAt IS NOT NULL AND publishedAt <= ?';
let ArticleRepository = class ArticleRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findPublishedPage(q, limit, offset, now) {
        const search = q ? ' AND (title LIKE ? OR summary LIKE ?)' : '';
        const searchParams = q ? [`%${escapeLike(q)}%`, `%${escapeLike(q)}%`] : [];
        const params = [now, ...searchParams];
        const [countRows, rows] = await Promise.all([
            this.dataSource.query(`SELECT COUNT(*) AS total FROM articles WHERE ${PUBLISHED_WHERE}${search}`, params),
            this.dataSource.query(`SELECT ${LIST_COLUMNS} FROM articles WHERE ${PUBLISHED_WHERE}${search}
         ORDER BY publishedAt DESC, id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
        ]);
        return { rows, total: Number(countRows[0]?.total ?? 0) };
    }
    async findPublishedBySlug(slug, now) {
        const rows = await this.dataSource.query(`SELECT ${FULL_COLUMNS} FROM articles WHERE slug = ? AND ${PUBLISHED_WHERE} LIMIT 1`, [slug, now]);
        return rows[0] ? { ...rows[0], isPublished: toBool(rows[0].isPublished) } : null;
    }
    findRelated(excludeId, limit, now) {
        return this.dataSource.query(`SELECT ${LIST_COLUMNS} FROM articles WHERE ${PUBLISHED_WHERE} AND id <> ?
       ORDER BY publishedAt DESC, id DESC LIMIT ?`, [now, excludeId, limit]);
    }
    async findAdminPage(q, published, limit, offset) {
        const conditions = ['1 = 1'];
        const params = [];
        if (q) {
            conditions.push('(title LIKE ? OR summary LIKE ?)');
            params.push(`%${escapeLike(q)}%`, `%${escapeLike(q)}%`);
        }
        if (published !== undefined) {
            conditions.push('isPublished = ?');
            params.push(published ? 1 : 0);
        }
        const where = conditions.join(' AND ');
        const [countRows, rows] = await Promise.all([
            this.dataSource.query(`SELECT COUNT(*) AS total FROM articles WHERE ${where}`, params),
            this.dataSource.query(`SELECT ${ADMIN_COLUMNS} FROM articles WHERE ${where} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
        ]);
        return {
            total: Number(countRows[0]?.total ?? 0),
            rows: rows.map((row) => ({ ...row, isPublished: toBool(row.isPublished) })),
        };
    }
    async findById(id) {
        const rows = await this.dataSource.query(`SELECT ${FULL_COLUMNS} FROM articles WHERE id = ?`, [id]);
        return rows[0] ? { ...rows[0], isPublished: toBool(rows[0].isPublished) } : null;
    }
    async findSlugsStartingWith(prefix) {
        const rows = await this.dataSource.query('SELECT slug FROM articles WHERE slug = ? OR slug LIKE ?', [prefix, `${escapeLike(prefix)}-%`]);
        return rows.map((row) => row.slug);
    }
    async insert(data) {
        const result = await this.dataSource.query(`INSERT INTO articles (title, slug, summary, content, thumbnailUrl, thumbnailPublicId, authorId, isPublished, publishedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            data.title,
            data.slug,
            data.summary ?? null,
            data.content,
            data.thumbnailUrl ?? null,
            data.thumbnailPublicId ?? null,
            data.authorId ?? null,
            data.isPublished ? 1 : 0,
            data.publishedAt ?? null,
        ]);
        return result.insertId;
    }
    async update(id, data) {
        const sets = [];
        const params = [];
        const add = (column, value) => {
            sets.push(`${column} = ?`);
            params.push(value);
        };
        if (data.title !== undefined)
            add('title', data.title);
        if (data.slug !== undefined)
            add('slug', data.slug);
        if (data.summary !== undefined)
            add('summary', data.summary);
        if (data.content !== undefined)
            add('content', data.content);
        if (data.thumbnailUrl !== undefined)
            add('thumbnailUrl', data.thumbnailUrl);
        if (data.thumbnailPublicId !== undefined)
            add('thumbnailPublicId', data.thumbnailPublicId);
        if (data.isPublished !== undefined)
            add('isPublished', data.isPublished ? 1 : 0);
        if (data.publishedAt !== undefined)
            add('publishedAt', data.publishedAt);
        if (!sets.length)
            return;
        await this.dataSource.query(`UPDATE articles SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }
    async delete(id) {
        await this.dataSource.query('DELETE FROM articles WHERE id = ?', [id]);
    }
};
ArticleRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], ArticleRepository);
export { ArticleRepository };
//# sourceMappingURL=article.repository.js.map