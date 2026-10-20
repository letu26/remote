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
let SettingsRepository = class SettingsRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findByKeys(keys) {
        const rows = await this.dataSource.query('SELECT setting_key AS `key`, value FROM site_settings WHERE setting_key IN (?)', [keys]);
        return new Map(rows.map((row) => [row.key, row.value]));
    }
    async upsertMany(entries) {
        const pairs = Object.entries(entries);
        if (!pairs.length)
            return;
        await this.dataSource.query('INSERT INTO site_settings (setting_key, value) VALUES ? ON DUPLICATE KEY UPDATE value = VALUES(value)', [pairs]);
    }
};
SettingsRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], SettingsRepository);
export { SettingsRepository };
//# sourceMappingURL=settings.repository.js.map