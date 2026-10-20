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
const COLUMNS = 'id, slug, title, content, isActive, updatedAt';
const toRow = (row) => ({ ...row, isActive: toBool(row.isActive) });
let PageRepository = class PageRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    findActiveSummaries() {
        return this.dataSource.query('SELECT slug, title FROM pages WHERE isActive = 1 ORDER BY title ASC, id ASC');
    }
    async findActiveBySlug(slug) {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM pages WHERE slug = ? AND isActive = 1 LIMIT 1`, [slug]);
        return rows[0] ? toRow(rows[0]) : null;
    }
    async findAll() {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM pages ORDER BY title ASC, id ASC`);
        return rows.map(toRow);
    }
    async findById(id) {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM pages WHERE id = ?`, [id]);
        return rows[0] ? toRow(rows[0]) : null;
    }
    async insert(data) {
        const result = await this.dataSource.query('INSERT INTO pages (slug, title, content, isActive) VALUES (?, ?, ?, ?)', [data.slug, data.title, data.content, data.isActive === false ? 0 : 1]);
        return result.insertId;
    }
    async update(id, data) {
        const sets = [];
        const params = [];
        const add = (column, value) => {
            sets.push(`${column} = ?`);
            params.push(value);
        };
        if (data.slug !== undefined)
            add('slug', data.slug);
        if (data.title !== undefined)
            add('title', data.title);
        if (data.content !== undefined)
            add('content', data.content);
        if (data.isActive !== undefined)
            add('isActive', data.isActive ? 1 : 0);
        if (!sets.length)
            return;
        await this.dataSource.query(`UPDATE pages SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }
    async delete(id) {
        await this.dataSource.query('DELETE FROM pages WHERE id = ?', [id]);
    }
};
PageRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], PageRepository);
export { PageRepository };
//# sourceMappingURL=page.repository.js.map