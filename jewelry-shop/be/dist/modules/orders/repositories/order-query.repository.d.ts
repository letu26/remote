import { DataSource } from 'typeorm';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '../models/order.enums.js';
export interface OrderRow {
    id: number;
    code: string;
    userId: number;
    createdAt: Date;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    paidAt: Date | null;
    cancelReason: string | null;
    note: string | null;
    receiverName: string;
    receiverPhone: string;
    provinceName: string;
    wardName: string;
    addressDetail: string;
    shippingMethodName: string;
    subtotal: number;
    shippingFee: number;
    total: number;
}
export interface OrderItemRow {
    productName: string;
    productCode: string;
    productSlug: string | null;
    size: string;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}
export interface OrderHistoryRow {
    status: OrderStatus;
    note: string | null;
    createdAt: Date;
    changedByName: string | null;
}
export interface OrderSummaryRow {
    id: number;
    code: string;
    createdAt: Date;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    total: number;
    receiverName: string;
    receiverPhone: string;
}
export interface OrderPreviewItem {
    productName: string;
    size: string;
    imageUrl: string | null;
    quantity: number;
}
export interface AdminOrderFilter {
    q?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    userId?: number;
    from?: Date;
    toExclusive?: Date;
}
export declare class OrderQueryRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findByCode(userId: number, code: string): Promise<OrderRow | null>;
    findById(id: number): Promise<OrderRow | null>;
    findItems(orderId: number): Promise<OrderItemRow[]>;
    findHistory(orderId: number): Promise<OrderHistoryRow[]>;
    findCustomer(userId: number): Promise<{
        id: number;
        fullName: string;
        phone: string;
        email: string;
    } | null>;
    findCustomerPage(userId: number, status: OrderStatus | undefined, limit: number, offset: number): Promise<{
        rows: OrderSummaryRow[];
        total: number;
    }>;
    findAdminPage(filter: AdminOrderFilter, limit: number, offset: number): Promise<{
        rows: OrderSummaryRow[];
        total: number;
    }>;
    findItemPreviews(orderIds: number[], limit: number): Promise<Map<number, {
        itemCount: number;
        items: OrderPreviewItem[];
    }>>;
    private findPage;
}
