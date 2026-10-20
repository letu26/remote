var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CustomerAdminService_1;
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { resolvePage, toPage } from '../../../utils/pagination.js';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import { UserRole, UserStatus } from '../../users/models/user.entity.js';
import { CustomerAdminRepository } from '../repositories/customer-admin.repository.js';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const RECENT_ORDERS = 10;
const EMPTY_STATS = { orderCount: 0, totalSpent: 0, lastOrderAt: null };
let CustomerAdminService = CustomerAdminService_1 = class CustomerAdminService {
    customers;
    blacklist;
    logger = new Logger(CustomerAdminService_1.name);
    constructor(customers, blacklist) {
        this.customers = customers;
        this.blacklist = blacklist;
    }
    async list(query) {
        const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const { rows, total } = await this.customers.findPage({ q: query.q || undefined, status: query.status, role: query.role }, request.pageSize, request.offset);
        const stats = await this.customers.findStats(rows.map((row) => row.id));
        return toPage(rows.map((row) => this.toItem(row, stats.get(row.id) ?? EMPTY_STATS)), total, request);
    }
    async detail(id) {
        const customer = await this.getOrFail(id);
        const [stats, counts, recentOrders] = await Promise.all([
            this.customers.findStats([id]),
            this.customers.findCounts(id),
            this.customers.findRecentOrders(id, RECENT_ORDERS),
        ]);
        return { ...this.toItem(customer, stats.get(id) ?? EMPTY_STATS), ...counts, recentOrders };
    }
    async updateStatus(adminId, id, dto) {
        const customer = await this.getOrFail(id);
        if (dto.status === UserStatus.LOCKED) {
            if (id === adminId) {
                throw new BusinessException(ErrorCode.CANNOT_MODIFY_SELF, 'Bạn không thể tự khóa tài khoản của chính mình', HttpStatus.CONFLICT);
            }
            if (customer.role === UserRole.ADMIN) {
                throw new BusinessException(ErrorCode.CANNOT_LOCK_ADMIN, 'Không thể khóa tài khoản quản trị viên', HttpStatus.CONFLICT);
            }
        }
        if (customer.status !== dto.status) {
            await this.customers.updateStatus(id, dto.status);
            this.logger.log(`admin ${adminId} đặt trạng thái tài khoản ${id}: ${customer.status} -> ${dto.status}`);
        }
        return this.detailItem(id);
    }
    async updateRole(adminId, id, dto) {
        if (id === adminId) {
            throw new BusinessException(ErrorCode.CANNOT_MODIFY_SELF, 'Bạn không thể tự đổi quyền của chính mình', HttpStatus.CONFLICT);
        }
        const outcome = await this.customers.withRoleChange(id, async (tx) => {
            if (tx.target.role === dto.role)
                return 'unchanged';
            const isActiveAdmin = tx.activeAdminIds.includes(tx.target.id);
            if (dto.role === UserRole.USER && isActiveAdmin && tx.activeAdminIds.length <= 1)
                return 'last_admin';
            await tx.setRole(dto.role);
            await this.blacklist.revokeAllInTransaction(tx.handle, id);
            return 'changed';
        });
        if (outcome === null)
            throw this.notFound();
        if (outcome === 'last_admin') {
            throw new BusinessException(ErrorCode.LAST_ADMIN, 'Không thể hạ quyền quản trị viên cuối cùng của hệ thống', HttpStatus.CONFLICT);
        }
        if (outcome === 'changed')
            this.logger.log(`admin ${adminId} đổi quyền tài khoản ${id} thành ${dto.role}`);
        return this.detailItem(id);
    }
    async detailItem(id) {
        const customer = await this.getOrFail(id);
        const stats = await this.customers.findStats([id]);
        return this.toItem(customer, stats.get(id) ?? EMPTY_STATS);
    }
    toItem(customer, stats) {
        return {
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
            role: customer.role,
            status: customer.status,
            createdAt: customer.createdAt,
            orderCount: stats.orderCount,
            totalSpent: stats.totalSpent,
            lastOrderAt: stats.lastOrderAt,
        };
    }
    async getOrFail(id) {
        const customer = await this.customers.findById(id);
        if (!customer)
            throw this.notFound();
        return customer;
    }
    notFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy khách hàng', HttpStatus.NOT_FOUND);
    }
};
CustomerAdminService = CustomerAdminService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CustomerAdminRepository,
        TokenBlacklistService])
], CustomerAdminService);
export { CustomerAdminService };
//# sourceMappingURL=customer-admin.service.js.map