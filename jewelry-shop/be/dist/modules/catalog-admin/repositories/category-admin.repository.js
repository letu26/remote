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
import { Category } from '../../catalog/models/category.entity.js';
let CategoryAdminRepository = class CategoryAdminRepository {
    repo;
    dataSource;
    constructor(repo, dataSource) {
        this.repo = repo;
        this.dataSource = dataSource;
    }
    async findAllWithCounts() {
        const rows = await this.dataSource.query(`SELECT c.id, c.name, c.slug, c.parentId, c.sortOrder, c.isActive,
              (SELECT COUNT(*) FROM products p WHERE p.categoryId = c.id) AS productCount,
              (SELECT COUNT(*) FROM categories x WHERE x.parentId = c.id) AS childCount
       FROM categories c
       ORDER BY c.sortOrder ASC, c.name ASC, c.id ASC`);
        return rows.map((row) => this.toAdminRow(row));
    }
    async findAdminById(id) {
        const rows = await this.dataSource.query(`SELECT c.id, c.name, c.slug, c.parentId, c.sortOrder, c.isActive,
              (SELECT COUNT(*) FROM products p WHERE p.categoryId = c.id) AS productCount,
              (SELECT COUNT(*) FROM categories x WHERE x.parentId = c.id) AS childCount
       FROM categories c WHERE c.id = ?`, [id]);
        return rows[0] ? this.toAdminRow(rows[0]) : null;
    }
    async exists(id) {
        return (await this.repo.count({ where: { id } })) > 0;
    }
    findParentLinks() {
        return this.repo.find({ select: { id: true, parentId: true } });
    }
    async findSlugsStartingWith(prefix) {
        const rows = await this.dataSource.query('SELECT slug FROM categories WHERE slug = ? OR slug LIKE ?', [prefix, `${prefix.replace(/[\\%_]/g, '\\$&')}-%`]);
        return rows.map((row) => row.slug);
    }
    async insert(data) {
        const saved = await this.repo.save(this.repo.create({
            name: data.name,
            slug: data.slug,
            parentId: data.parentId ?? null,
            sortOrder: data.sortOrder ?? 0,
            isActive: data.isActive ?? true,
        }));
        return saved.id;
    }
    async update(id, data) {
        if (Object.keys(data).length)
            await this.repo.update({ id }, data);
    }
    async countChildren(id) {
        return this.repo.count({ where: { parentId: id } });
    }
    async countProducts(id) {
        const rows = await this.dataSource.query('SELECT COUNT(*) AS total FROM products WHERE categoryId = ?', [id]);
        return Number(rows[0]?.total ?? 0);
    }
    async delete(id) {
        await this.repo.delete({ id });
    }
    toAdminRow(row) {
        return {
            ...row,
            isActive: toBool(row.isActive),
            productCount: Number(row.productCount),
            childCount: Number(row.childCount),
        };
    }
};
CategoryAdminRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(Category)),
    __param(1, InjectDataSource()),
    __metadata("design:paramtypes", [Repository,
        DataSource])
], CategoryAdminRepository);
export { CategoryAdminRepository };
//# sourceMappingURL=category-admin.repository.js.map