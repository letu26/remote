import { BusinessException } from '../../../exceptions/index.js';
import { PaymentService } from '../../payments/services/payment.service.js';
import { OrderQueryRepository, type OrderRow } from '../repositories/order-query.repository.js';
export declare class OrderViewService {
    private readonly queries;
    private readonly payments;
    constructor(queries: OrderQueryRepository, payments: PaymentService);
    customerDetail(order: OrderRow): Promise<{
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
    adminDetail(order: OrderRow): Promise<{
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
    notFound(): BusinessException;
    private base;
}
