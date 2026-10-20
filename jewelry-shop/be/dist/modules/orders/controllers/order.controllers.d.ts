import type { Response } from 'express';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { AdminOrderListQueryDto, CancelOrderDto, CreateOrderDto, OrderListQueryDto, PreviewOrderDto, UpdateOrderPaymentDto, UpdateOrderStatusDto } from '../dtos/order.dtos.js';
import { OrderAdminService } from '../services/order-admin.service.js';
import { OrderService } from '../services/order.service.js';
export declare class OrderController {
    private readonly service;
    constructor(service: OrderService);
    preview(user: AuthenticatedUser, dto: PreviewOrderDto): Promise<{
        items: {
            cartItemId: number;
            variantId: number;
            productId: number;
            productName: string;
            productSlug: string;
            productCode: string;
            size: string;
            imageUrl: string | null;
            unitPrice: number;
            quantity: number;
            lineTotal: number;
        }[];
        subtotal: number;
        shippingFee: number;
        total: number;
        issues: {
            available?: number | undefined;
            cartItemId: number;
            issue: import("../../cart/services/cart.service.js").CartIssue | null;
        }[];
    }>;
    create(user: AuthenticatedUser, idempotencyKey: string | undefined, dto: CreateOrderDto, res: Response): Promise<{
        items: import("../repositories/order-query.repository.js").OrderItemRow[];
        history: {
            status: import("../models/order.enums.js").OrderStatus;
            note: string | null;
            createdAt: Date;
        }[];
        paymentInstructions: import("../../payments/services/payment.service.js").PaymentInstructions | null;
        code: string;
        createdAt: Date;
        status: import("../models/order.enums.js").OrderStatus;
        paymentMethod: import("../models/order.enums.js").PaymentMethod;
        paymentStatus: import("../models/order.enums.js").PaymentStatus;
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
    }>;
    list(user: AuthenticatedUser, query: OrderListQueryDto): Promise<import("../../../utils/pagination.js").Page<unknown>>;
    detail(user: AuthenticatedUser, code: string): Promise<{
        items: import("../repositories/order-query.repository.js").OrderItemRow[];
        history: {
            status: import("../models/order.enums.js").OrderStatus;
            note: string | null;
            createdAt: Date;
        }[];
        paymentInstructions: import("../../payments/services/payment.service.js").PaymentInstructions | null;
        code: string;
        createdAt: Date;
        status: import("../models/order.enums.js").OrderStatus;
        paymentMethod: import("../models/order.enums.js").PaymentMethod;
        paymentStatus: import("../models/order.enums.js").PaymentStatus;
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
    }>;
    cancel(user: AuthenticatedUser, code: string, dto: CancelOrderDto): Promise<{
        items: import("../repositories/order-query.repository.js").OrderItemRow[];
        history: {
            status: import("../models/order.enums.js").OrderStatus;
            note: string | null;
            createdAt: Date;
        }[];
        paymentInstructions: import("../../payments/services/payment.service.js").PaymentInstructions | null;
        code: string;
        createdAt: Date;
        status: import("../models/order.enums.js").OrderStatus;
        paymentMethod: import("../models/order.enums.js").PaymentMethod;
        paymentStatus: import("../models/order.enums.js").PaymentStatus;
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
    }>;
}
export declare class OrderAdminController {
    private readonly service;
    constructor(service: OrderAdminService);
    list(query: AdminOrderListQueryDto): Promise<import("../../../utils/pagination.js").Page<unknown>>;
    detail(id: number): Promise<{
        customer: {
            id: number;
            fullName: string;
            phone: string;
            email: string;
        } | null;
        items: import("../repositories/order-query.repository.js").OrderItemRow[];
        history: {
            status: import("../models/order.enums.js").OrderStatus;
            note: string | null;
            createdAt: Date;
            changedByName: string;
        }[];
        code: string;
        createdAt: Date;
        status: import("../models/order.enums.js").OrderStatus;
        paymentMethod: import("../models/order.enums.js").PaymentMethod;
        paymentStatus: import("../models/order.enums.js").PaymentStatus;
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
    updateStatus(admin: AuthenticatedUser, id: number, dto: UpdateOrderStatusDto): Promise<{
        customer: {
            id: number;
            fullName: string;
            phone: string;
            email: string;
        } | null;
        items: import("../repositories/order-query.repository.js").OrderItemRow[];
        history: {
            status: import("../models/order.enums.js").OrderStatus;
            note: string | null;
            createdAt: Date;
            changedByName: string;
        }[];
        code: string;
        createdAt: Date;
        status: import("../models/order.enums.js").OrderStatus;
        paymentMethod: import("../models/order.enums.js").PaymentMethod;
        paymentStatus: import("../models/order.enums.js").PaymentStatus;
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
    updatePayment(admin: AuthenticatedUser, id: number, dto: UpdateOrderPaymentDto): Promise<{
        customer: {
            id: number;
            fullName: string;
            phone: string;
            email: string;
        } | null;
        items: import("../repositories/order-query.repository.js").OrderItemRow[];
        history: {
            status: import("../models/order.enums.js").OrderStatus;
            note: string | null;
            createdAt: Date;
            changedByName: string;
        }[];
        code: string;
        createdAt: Date;
        status: import("../models/order.enums.js").OrderStatus;
        paymentMethod: import("../models/order.enums.js").PaymentMethod;
        paymentStatus: import("../models/order.enums.js").PaymentStatus;
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
