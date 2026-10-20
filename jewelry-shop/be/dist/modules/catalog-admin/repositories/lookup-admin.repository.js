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
import { toBool } from '../../../utils/db-error.util.js';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
const LOOKUP_TABLES = {
    materials: { table: 'materials', usageTable: 'products', usageColumn: 'materialId', productIdColumn: 'id' },
    gemstones: { table: 'gemstones', usageTable: 'product_gemstones', usageColumn: 'gemstoneId', productIdColumn: 'productId' },
};
const toRow = (row) => ({
    id: row.id,
    name: row.name,
    isActive: toBool(row.isActive),
    productCount: Number(row.productCount),
});
let LookupAdminRepository = class LookupAdminRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findAll(kind) {
        const { table, usageTable, usageColumn, productIdColumn } = LOOKUP_TABLES[kind];
        const rows = await this.dataSource.query(`SELECT t.id, t.name, t.isActive,
              (SELECT COUNT(DISTINCT u.${productIdColumn}) FROM ${usageTable} u WHERE u.${usageColumn} = t.id) AS productCount
       FROM ${table} t ORDER BY t.name ASC`);
        return rows.map(toRow);
    }
    async findById(kind, id) {
        const { table, usageTable, usageColumn, productIdColumn } = LOOKUP_TABLES[kind];
        const rows = await this.dataSource.query(`SELECT t.id, t.name, t.isActive,
              (SELECT COUNT(DISTINCT u.${productIdColumn}) FROM ${usageTable} u WHERE u.${usageColumn} = t.id) AS productCount
       FROM ${table} t WHERE t.id = ?`, [id]);
        return rows[0] ? toRow(rows[0]) : null;
    }
    async insert(kind, name, isActive) {
        const result = await this.dataSource.query(`INSERT INTO ${LOOKUP_TABLES[kind].table} (name, isActive) VALUES (?, ?)`, [name, isActive ? 1 : 0]);
        return result.insertId;
    }
    async update(kind, id, data) {
        const sets = [];
        const params = [];
        if (data.name !== undefined) {
            sets.push('name = ?');
            params.push(data.name);
        }
        if (data.isActive !== undefined) {
            sets.push('isActive = ?');
            params.push(data.isActive ? 1 : 0);
        }
        if (!sets.length)
            return;
        await this.dataSource.query(`UPDATE ${LOOKUP_TABLES[kind].table} SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }
    async delete(kind, id) {
        await this.dataSource.query(`DELETE FROM ${LOOKUP_TABLES[kind].table} WHERE id = ?`, [id]);
    }
};
LookupAdminRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], LookupAdminRepository);
export { LookupAdminRepository };
//# sourceMappingURL=lookup-admin.repository.js.map