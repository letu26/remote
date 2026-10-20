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
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Collection } from '../../catalog/models/collection.entity.js';
const SELECT_WITH_COUNT = `
  SELECT c.id, c.name, c.slug, c.description, c.bannerUrl, c.isActive,
         (SELECT COUNT(*) FROM products p WHERE p.collectionId = c.id) AS productCount
  FROM collections c`;
let CollectionAdminRepository = class CollectionAdminRepository {
    repo;
    dataSource;
    constructor(repo, dataSource) {
        this.repo = repo;
        this.dataSource = dataSource;
    }
    async findAll() {
        const rows = await this.dataSource.query(`${SELECT_WITH_COUNT} ORDER BY c.name ASC, c.id ASC`);
        return rows.map((row) => this.toRow(row));
    }
    async findById(id) {
        const rows = await this.dataSource.query(`${SELECT_WITH_COUNT} WHERE c.id = ?`, [id]);
        return rows[0] ? this.toRow(rows[0]) : null;
    }
    async findSlugsStartingWith(prefix) {
        const rows = await this.dataSource.query('SELECT slug FROM collections WHERE slug = ? OR slug LIKE ?', [prefix, `${prefix.replace(/[\\%_]/g, '\\$&')}-%`]);
        return rows.map((row) => row.slug);
    }
    async insert(data) {
        const saved = await this.repo.save(this.repo.create({
            name: data.name,
            slug: data.slug,
            description: data.description ?? null,
            bannerUrl: data.bannerUrl ?? null,
            isActive: data.isActive ?? true,
        }));
        return saved.id;
    }
    async update(id, data) {
        if (Object.keys(data).length)
            await this.repo.update({ id }, data);
    }
    async delete(id) {
        await this.repo.delete({ id });
    }
    toRow(row) {
        return { ...row, isActive: toBool(row.isActive), productCount: Number(row.productCount) };
    }
};
CollectionAdminRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(Collection)),
    __param(1, InjectDataSource()),
    __metadata("design:paramtypes", [Repository,
        DataSource])
], CollectionAdminRepository);
export { CollectionAdminRepository };
//# sourceMappingURL=collection-admin.repository.js.map