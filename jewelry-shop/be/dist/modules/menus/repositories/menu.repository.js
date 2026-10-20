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
const COLUMNS = 'id, label, url, parentId, placement, sortOrder, isActive';
const toRow = (row) => ({ ...row, isActive: toBool(row.isActive) });
let MenuRepository = class MenuRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findActiveByPlacement(placement) {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM menus WHERE placement = ? AND isActive = 1 ORDER BY sortOrder ASC, id ASC`, [placement]);
        return rows.map(toRow);
    }
    async findAll() {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM menus ORDER BY placement ASC, sortOrder ASC, id ASC`);
        return rows.map(toRow);
    }
    async findById(id) {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM menus WHERE id = ?`, [id]);
        return rows[0] ? toRow(rows[0]) : null;
    }
    runInTransaction(work) {
        return this.dataSource.transaction((manager) => work(this.createTransaction(manager)));
    }
    async countChildren(id) {
        const rows = await this.dataSource.query('SELECT COUNT(*) AS total FROM menus WHERE parentId = ?', [id]);
        return Number(rows[0]?.total ?? 0);
    }
    async delete(id) {
        await this.dataSource.query('DELETE FROM menus WHERE id = ?', [id]);
    }
    createTransaction(manager) {
        return {
            lock: async (id) => {
                const rows = await manager.query(`SELECT ${COLUMNS} FROM menus WHERE id = ? FOR UPDATE`, [id]);
                return rows[0] ? toRow(rows[0]) : null;
            },
            countChildren: async (id) => {
                const rows = await manager.query('SELECT COUNT(*) AS total FROM menus WHERE parentId = ? FOR UPDATE', [id]);
                return Number(rows[0]?.total ?? 0);
            },
            insert: async (data) => {
                const result = await manager.query('INSERT INTO menus (label, url, parentId, placement, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, ?)', [data.label, data.url, data.parentId ?? null, data.placement, data.sortOrder ?? 0, data.isActive === false ? 0 : 1]);
                return result.insertId;
            },
            update: async (id, data) => {
                const sets = [];
                const params = [];
                const add = (column, value) => {
                    sets.push(`${column} = ?`);
                    params.push(value);
                };
                if (data.label !== undefined)
                    add('label', data.label);
                if (data.url !== undefined)
                    add('url', data.url);
                if (data.parentId !== undefined)
                    add('parentId', data.parentId);
                if (data.placement !== undefined)
                    add('placement', data.placement);
                if (data.sortOrder !== undefined)
                    add('sortOrder', data.sortOrder);
                if (data.isActive !== undefined)
                    add('isActive', data.isActive ? 1 : 0);
                if (!sets.length)
                    return;
                await manager.query(`UPDATE menus SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
            },
            setChildrenPlacement: async (parentId, placement) => {
                await manager.query('UPDATE menus SET placement = ? WHERE parentId = ?', [placement, parentId]);
            },
        };
    }
};
MenuRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], MenuRepository);
export { MenuRepository };
//# sourceMappingURL=menu.repository.js.map