var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { startOfVietnamDay } from '../../../utils/order-code.util.js';
import { resolvePage, toPage } from '../../../utils/pagination.js';
import { PaymentService } from '../../payments/services/payment.service.js';
import { OrderStatus, PaymentStatus } from '../models/order.enums.js';
import { OrderQueryRepository } from '../repositories/order-query.repository.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { isValidAdminTransition } from './order-status.rules.js';
import { OrderViewService } from './order-view.service.js';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;
let OrderAdminService = class OrderAdminService {
    orders;
    queries;
    payments;
    views;
    constructor(orders, queries, payments, views) {
        this.orders = orders;
        this.queries = queries;
        this.payments = payments;
        this.views = views;
    }
    async list(query) {
        const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const { rows, total } = await this.queries.findAdminPage({
            q: query.q || undefined,
            status: query.status,
            paymentStatus: query.paymentStatus,
            userId: query.userId,
            from: query.from ? startOfVietnamDay(query.from) : undefined,
            toExclusive: query.to ? new Date(startOfVietnamDay(query.to).getTime() + DAY_MS) : undefined,
        }, request.pageSize, request.offset);
        const previews = await this.queries.findItemPreviews(rows.map((row) => row.id), 0);
        const items = rows.map((row) => ({
            id: row.id,
            code: row.code,
            createdAt: row.createdAt,
            receiverName: row.receiverName,
            receiverPhone: row.receiverPhone,
            status: row.status,
            paymentMethod: row.paymentMethod,
            paymentStatus: row.paymentStatus,
            total: row.total,
            itemCount: previews.get(row.id)?.itemCount ?? 0,
        }));
        return toPage(items, total, request);
    }
    async detail(id) {
        const order = await this.queries.findById(id);
        if (!order)
            throw this.views.notFound();
        return this.views.adminDetail(order);
    }
    async updateStatus(id, adminId, dto) {
        const note = dto.note?.trim() || null;
        const outcome = await this.orders.withLockedOrder({ id }, async (tx) => {
            const from = tx.order.status;
            if (!isValidAdminTransition(from, dto.status))
                return { invalid: from };
            if (dto.status === OrderStatus.CANCELLED) {
                await tx.update({ status: OrderStatus.CANCELLED, cancelReason: note });
                await tx.restockItems();
            }
            else if (dto.status === OrderStatus.DELIVERED) {
                const settlement = this.payments.settlementOnDelivery(tx.order.paymentMethod);
                await tx.update({ status: OrderStatus.DELIVERED, ...settlement });
                await tx.increaseSoldCount();
            }
            else {
                await tx.update({ status: dto.status });
            }
            await tx.addHistory(dto.status, adminId, note);
            return { invalid: null };
        });
        if (outcome === null)
            throw this.views.notFound();
        if (outcome.invalid) {
            throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, `Không thể chuyển đơn từ "${outcome.invalid}" sang "${dto.status}"`, HttpStatus.CONFLICT);
        }
        return this.detail(id);
    }
    async updatePayment(id, adminId, dto) {
        const outcome = await this.orders.withLockedOrder({ id }, async (tx) => {
            this.payments.assertManualPaymentAllowed(tx.order);
            const paid = dto.paymentStatus === PaymentStatus.PAID;
            await tx.update({ paymentStatus: dto.paymentStatus, paidAt: paid ? new Date() : null });
            const label = paid ? 'Xác nhận đã nhận thanh toán' : 'Hủy xác nhận thanh toán';
            await tx.addHistory(tx.order.status, adminId, dto.note?.trim() ? `${label}: ${dto.note.trim()}` : label);
            return true;
        });
        if (outcome === null)
            throw this.views.notFound();
        return this.detail(id);
    }
};
OrderAdminService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [OrderRepository,
        OrderQueryRepository,
        PaymentService,
        OrderViewService])
], OrderAdminService);
export { OrderAdminService };
//# sourceMappingURL=order-admin.service.js.map