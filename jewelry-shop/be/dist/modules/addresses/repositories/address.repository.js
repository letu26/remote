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
const SELECT_VIEW = `
  SELECT a.id, a.receiverName, a.receiverPhone, a.provinceId, p.name AS provinceName,
         a.wardId, w.name AS wardName, a.detail, a.isDefault
  FROM addresses a
  JOIN provinces p ON p.id = a.provinceId
  JOIN wards w ON w.id = a.wardId`;
const toView = (row) => ({ ...row, isDefault: toBool(row.isDefault) });
let AddressRepository = class AddressRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findAll(userId) {
        const rows = await this.dataSource.query(`${SELECT_VIEW} WHERE a.userId = ? ORDER BY a.isDefault DESC, a.createdAt ASC, a.id ASC`, [userId]);
        return rows.map(toView);
    }
    async findOne(userId, id) {
        const rows = await this.dataSource.query(`${SELECT_VIEW} WHERE a.userId = ? AND a.id = ?`, [userId, id]);
        return rows[0] ? toView(rows[0]) : null;
    }
    async wardBelongsToProvince(wardId, provinceId) {
        const rows = await this.dataSource.query('SELECT 1 FROM wards WHERE id = ? AND provinceId = ? LIMIT 1', [wardId, provinceId]);
        return rows.length > 0;
    }
    create(userId, fields, wantDefault, maxAddresses) {
        return this.dataSource.transaction(async (manager) => {
            await this.lockUser(manager, userId);
            const count = await this.count(manager, userId);
            if (count >= maxAddresses)
                return { ok: false, reason: 'limit' };
            const makeDefault = count === 0 || wantDefault;
            if (makeDefault && count > 0)
                await manager.query('UPDATE addresses SET isDefault = 0 WHERE userId = ?', [userId]);
            const result = await manager.query(`INSERT INTO addresses (userId, receiverName, receiverPhone, provinceId, wardId, detail, isDefault)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [userId, fields.receiverName, fields.receiverPhone, fields.provinceId, fields.wardId, fields.detail, makeDefault ? 1 : 0]);
            return { ok: true, id: result.insertId };
        });
    }
    update(userId, id, fields, makeDefault) {
        return this.dataSource.transaction(async (manager) => {
            await this.lockUser(manager, userId);
            const sets = Object.keys(fields).map((key) => `${key} = ?`);
            if (sets.length) {
                await manager.query(`UPDATE addresses SET ${sets.join(', ')} WHERE id = ? AND userId = ?`, [
                    ...Object.values(fields),
                    id,
                    userId,
                ]);
            }
            if (makeDefault)
                await this.setDefault(manager, userId, id);
        });
    }
    makeDefault(userId, id) {
        return this.dataSource.transaction(async (manager) => {
            await this.lockUser(manager, userId);
            await this.setDefault(manager, userId, id);
        });
    }
    remove(userId, id) {
        return this.dataSource.transaction(async (manager) => {
            await this.lockUser(manager, userId);
            const rows = await manager.query('SELECT isDefault FROM addresses WHERE id = ? AND userId = ?', [id, userId]);
            if (!rows.length)
                return false;
            await manager.query('DELETE FROM addresses WHERE id = ? AND userId = ?', [id, userId]);
            if (toBool(rows[0].isDefault)) {
                await manager.query('UPDATE addresses SET isDefault = 1 WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1', [userId]);
            }
            return true;
        });
    }
    async lockUser(manager, userId) {
        await manager.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
    }
    async count(manager, userId) {
        const rows = await manager.query('SELECT COUNT(*) AS total FROM addresses WHERE userId = ?', [userId]);
        return Number(rows[0]?.total ?? 0);
    }
    async setDefault(manager, userId, id) {
        await manager.query('UPDATE addresses SET isDefault = (id = ?) WHERE userId = ?', [id, userId]);
    }
};
AddressRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], AddressRepository);
export { AddressRepository };
//# sourceMappingURL=address.repository.js.map