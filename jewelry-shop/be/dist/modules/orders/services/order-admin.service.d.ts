import { type Page } from '../../../utils/pagination.js';
import { PaymentService } from '../../payments/services/payment.service.js';
import type { AdminOrderListQueryDto, UpdateOrderPaymentDto, UpdateOrderStatusDto } from '../dtos/order.dtos.js';
import { OrderStatus, PaymentStatus } from '../models/order.enums.js';
import { OrderQueryRepository } from '../repositories/order-query.repository.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { OrderViewService } from './order-view.service.js';
export declare class OrderAdminService {
    private readonly orders;
    private readonly queries;
    private readonly payments;
    private readonly views;
    constructor(orders: OrderRepository, queries: OrderQueryRepository, payments: PaymentService, views: OrderViewService);
    list(query: AdminOrderListQueryDto): Promise<Page<unknown>>;
    detail(id: number): Promise<{
        customer: {
            id: number;
            fullName: string;
            phone: string;
            email: string;
        } | null;
        items: import("../repositories/order-query.repository.js").OrderItemRow[];
        history: {
            status: OrderStatus;
            note: string | null;
            createdAt: Date;
            changedByName: string;
        }[];
        code: string;
        createdAt: Date;
        status: OrderStatus;
        paymentMethod: import("../models/order.enums.js").PaymentMethod;
        paymentStatus: PaymentStatus;
        paidAt: Date | null;
        cancelReason: string | null;
        note: string | null;
        receiver: {
            name: string;
            phone: string;
            province: string;
            ward: string;
            addressDetail: string;
        };
        shippingMethodName: string;
        subtotal: number;
        shippingFee: number;
        total: number;
        id: number;
    }>;
    updateStatus(id: number, adminId: number, dto: UpdateOrderStatusDto): Promise<{
        customer: {
            id: number;
            fullName: string;
            phone: string;
            email: string;
        } | null;
        items: import("../repositories/order-query.repository.js").OrderItemRow[];
        history: {
            status: OrderStatus;
            note: string | null;
            createdAt: Date;
            changedByName: string;
        }[];
        code: string;
        createdAt: Date;
        status: OrderStatus;
        paymentMethod: import("../models/order.enums.js").PaymentMethod;
        paymentStatus: PaymentStatus;
        paidAt: Date | null;
        cancelReason: string | null;
        note: string | null;
        receiver: {
            name: string;
            phone: string;
            province: string;
            ward: string;
            addressDetail: string;
        };
        shippingMethodName: string;
        subtotal: number;
        shippingFee: number;
        total: number;
        id: number;
    }>;
    updatePayment(id: number, adminId: number, dto: UpdateOrderPaymentDto): Promise<{
        customer: {
            id: number;
            fullName: string;
            phone: string;
            email: string;
        } | null;
        items: import("../repositories/order-query.repository.js").OrderItemRow[];
        history: {
            status: OrderStatus;
            note: string | null;
            createdAt: Date;
            changedByName: string;
        }[];
        code: string;
        createdAt: Date;
        status: OrderStatus;
        paymentMethod: import("../models/order.enums.js").PaymentMethod;
        paymentStatus: PaymentStatus;
        paidAt: Date | null;
        cancelReason: string | null;
        note: string | null;
        receiver: {
            name: string;
            phone: string;
            province: string;
            ward: string;
            addressDetail: string;
        };
        shippingMethodName: string;
        subtotal: number;
        shippingFee: number;
        total: number;
        id: number;
    }>;
}
