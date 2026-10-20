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
const COLUMNS = 'id, question, answer, keywords, sortOrder, isActive';
const toRow = (row) => ({ ...row, isActive: toBool(row.isActive) });
let FaqRepository = class FaqRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findActive() {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM faqs WHERE isActive = 1 ORDER BY sortOrder ASC, id ASC`);
        return rows.map(toRow);
    }
    async findAll() {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM faqs ORDER BY sortOrder ASC, id ASC`);
        return rows.map(toRow);
    }
    async findById(id) {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM faqs WHERE id = ?`, [id]);
        return rows[0] ? toRow(rows[0]) : null;
    }
    async insert(data) {
        const result = await this.dataSource.query('INSERT INTO faqs (question, answer, keywords, sortOrder, isActive) VALUES (?, ?, ?, ?, ?)', [data.question, data.answer, data.keywords ?? null, data.sortOrder ?? 0, data.isActive === false ? 0 : 1]);
        return result.insertId;
    }
    async update(id, data) {
        const sets = [];
        const params = [];
        const add = (column, value) => {
            sets.push(`${column} = ?`);
            params.push(value);
        };
        if (data.question !== undefined)
            add('question', data.question);
        if (data.answer !== undefined)
            add('answer', data.answer);
        if (data.keywords !== undefined)
            add('keywords', data.keywords);
        if (data.sortOrder !== undefined)
            add('sortOrder', data.sortOrder);
        if (data.isActive !== undefined)
            add('isActive', data.isActive ? 1 : 0);
        if (!sets.length)
            return;
        await this.dataSource.query(`UPDATE faqs SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }
    async delete(id) {
        await this.dataSource.query('DELETE FROM faqs WHERE id = ?', [id]);
    }
};
FaqRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], FaqRepository);
export { FaqRepository };
//# sourceMappingURL=faq.repository.js.map