import { PageQueryDto } from '../../../utils/pagination.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../models/order.enums.js';
export declare class PreviewOrderDto {
    itemIds: number[];
    shippingMethodId?: number;
}
export declare class CreateOrderDto {
    itemIds: number[];
    addressId: number;
    shippingMethodId: number;
    paymentMethod: PaymentMethod;
    note?: string;
    expectedTotal: number;
}
export declare class CancelOrderDto {
    reason?: string;
}
export declare class OrderListQueryDto extends PageQueryDto {
    status?: OrderStatus;
}
export declare class AdminOrderListQueryDto extends PageQueryDto {
    q?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    userId?: number;
    from?: string;
    to?: string;
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    note?: string;
}
export declare class UpdateOrderPaymentDto {
    paymentStatus: PaymentStatus;
    note?: string;
}
