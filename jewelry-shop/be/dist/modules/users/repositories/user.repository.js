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
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from '../models/user.entity.js';
let UserRepository = class UserRepository {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    findById(id) {
        return this.repo.findOne({ where: { id } });
    }
    findByEmail(email) {
        return this.repo.findOne({ where: { email } });
    }
    findByPhoneWithPassword(phone) {
        return this.repo
            .createQueryBuilder('u')
            .addSelect('u.passwordHash')
            .where('u.phone = :phone', { phone })
            .getOne();
    }
    findByIdWithPassword(id) {
        return this.repo
            .createQueryBuilder('u')
            .addSelect('u.passwordHash')
            .where('u.id = :id', { id })
            .getOne();
    }
    findConflicts(email, phone, excludeId) {
        const where = [
            ...(email ? [{ email, ...(excludeId ? { id: Not(excludeId) } : {}) }] : []),
            ...(phone ? [{ phone, ...(excludeId ? { id: Not(excludeId) } : {}) }] : []),
        ];
        if (!where.length)
            return Promise.resolve([]);
        return this.repo.find({ select: { id: true, email: true, phone: true }, where });
    }
    create(data) {
        return this.repo.save(this.repo.create(data));
    }
    async updateProfile(id, data) {
        if (Object.keys(data).length)
            await this.repo.update({ id }, data);
    }
};
UserRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository])
], UserRepository);
export { UserRepository };
//# sourceMappingURL=user.repository.js.map