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
import { PaymentService } from '../../payments/services/payment.service.js';
import { OrderQueryRepository } from '../repositories/order-query.repository.js';
let OrderViewService = class OrderViewService {
    queries;
    payments;
    constructor(queries, payments) {
        this.queries = queries;
        this.payments = payments;
    }
    async customerDetail(order) {
        const [items, history, paymentInstructions] = await Promise.all([
            this.queries.findItems(order.id),
            this.queries.findHistory(order.id),
            this.payments.buildInstructions(order),
        ]);
        return {
            ...this.base(order),
            items,
            history: history.map(({ status, note, createdAt }) => ({ status, note, createdAt })),
            paymentInstructions,
        };
    }
    async adminDetail(order) {
        const [items, history, customer] = await Promise.all([
            this.queries.findItems(order.id),
            this.queries.findHistory(order.id),
            this.queries.findCustomer(order.userId),
        ]);
        return {
            id: order.id,
            ...this.base(order),
            customer,
            items,
            history: history.map(({ status, note, createdAt, changedByName }) => ({
                status,
                note,
                createdAt,
                changedByName: changedByName ?? 'Hệ thống',
            })),
        };
    }
    notFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy đơn hàng', HttpStatus.NOT_FOUND);
    }
    base(order) {
        return {
            code: order.code,
            createdAt: order.createdAt,
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            paidAt: order.paidAt,
            cancelReason: order.cancelReason,
            note: order.note,
            receiver: {
                name: order.receiverName,
                phone: order.receiverPhone,
                province: order.provinceName,
                ward: order.wardName,
                addressDetail: order.addressDetail,
            },
            shippingMethodName: order.shippingMethodName,
            subtotal: order.subtotal,
            shippingFee: order.shippingFee,
            total: order.total,
        };
    }
};
OrderViewService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [OrderQueryRepository,
        PaymentService])
], OrderViewService);
export { OrderViewService };
//# sourceMappingURL=order-view.service.js.map