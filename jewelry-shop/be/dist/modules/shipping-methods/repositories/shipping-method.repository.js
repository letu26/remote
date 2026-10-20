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
const toRow = (row) => ({ ...row, fee: Number(row.fee), isActive: toBool(row.isActive) });
let ShippingMethodRepository = class ShippingMethodRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findAll(onlyActive) {
        const rows = await this.dataSource.query(`SELECT id, name, description, fee, isActive FROM shipping_methods ${onlyActive ? 'WHERE isActive = 1' : ''} ORDER BY fee ASC, id ASC`);
        return rows.map(toRow);
    }
    async findById(id) {
        const rows = await this.dataSource.query('SELECT id, name, description, fee, isActive FROM shipping_methods WHERE id = ?', [id]);
        return rows[0] ? toRow(rows[0]) : null;
    }
    async insert(data) {
        const result = await this.dataSource.query('INSERT INTO shipping_methods (name, description, fee, isActive) VALUES (?, ?, ?, ?)', [data.name, data.description, data.fee, data.isActive ? 1 : 0]);
        return result.insertId;
    }
    async update(id, data) {
        const sets = [];
        const params = [];
        if (data.name !== undefined) {
            sets.push('name = ?');
            params.push(data.name);
        }
        if (data.description !== undefined) {
            sets.push('description = ?');
            params.push(data.description);
        }
        if (data.fee !== undefined) {
            sets.push('fee = ?');
            params.push(data.fee);
        }
        if (data.isActive !== undefined) {
            sets.push('isActive = ?');
            params.push(data.isActive ? 1 : 0);
        }
        if (!sets.length)
            return;
        await this.dataSource.query(`UPDATE shipping_methods SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }
    async countOrders(id) {
        const rows = await this.dataSource.query('SELECT COUNT(*) AS total FROM orders WHERE shippingMethodId = ?', [id]);
        return Number(rows[0]?.total ?? 0);
    }
    async delete(id) {
        await this.dataSource.query('DELETE FROM shipping_methods WHERE id = ?', [id]);
    }
};
ShippingMethodRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], ShippingMethodRepository);
export { ShippingMethodRepository };
//# sourceMappingURL=shipping-method.repository.js.map