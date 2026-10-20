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
const COLUMNS = 'id, title, imageUrl, imagePublicId, linkUrl, position, sortOrder, isActive, createdAt';
const toRow = (row) => ({ ...row, isActive: toBool(row.isActive) });
let BannerRepository = class BannerRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findActive(position) {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM banners WHERE isActive = 1 ${position ? 'AND position = ?' : ''} ORDER BY sortOrder ASC, id ASC`, position ? [position] : []);
        return rows.map(toRow);
    }
    async findAll() {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM banners ORDER BY position ASC, sortOrder ASC, id ASC`);
        return rows.map(toRow);
    }
    async findById(id) {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM banners WHERE id = ?`, [id]);
        return rows[0] ? toRow(rows[0]) : null;
    }
    async insert(data) {
        const result = await this.dataSource.query(`INSERT INTO banners (title, imageUrl, imagePublicId, linkUrl, position, sortOrder, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            data.title,
            data.imageUrl,
            data.imagePublicId ?? null,
            data.linkUrl ?? null,
            data.position,
            data.sortOrder ?? 0,
            data.isActive === false ? 0 : 1,
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
        if (data.imageUrl !== undefined)
            add('imageUrl', data.imageUrl);
        if (data.imagePublicId !== undefined)
            add('imagePublicId', data.imagePublicId);
        if (data.linkUrl !== undefined)
            add('linkUrl', data.linkUrl);
        if (data.position !== undefined)
            add('position', data.position);
        if (data.sortOrder !== undefined)
            add('sortOrder', data.sortOrder);
        if (data.isActive !== undefined)
            add('isActive', data.isActive ? 1 : 0);
        if (!sets.length)
            return;
        await this.dataSource.query(`UPDATE banners SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }
    async delete(id) {
        await this.dataSource.query('DELETE FROM banners WHERE id = ?', [id]);
    }
};
BannerRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], BannerRepository);
export { BannerRepository };
//# sourceMappingURL=banner.repository.js.map