import { BaseEntity } from '../../../models/base.entity.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from './order.enums.js';
export declare class Order extends BaseEntity {
    code: string;
    userId: number;
    receiverName: string;
    receiverPhone: string;
    provinceName: string;
    wardName: string;
    addressDetail: string;
    note: string | null;
    shippingMethodId: number;
    shippingMethodName: string;
    subtotal: number;
    shippingFee: number;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    paidAt: Date | null;
    status: OrderStatus;
    cancelReason: string | null;
}
