import { DataSource } from 'typeorm';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../models/order.enums.js';
export interface NewOrderLine {
    cartItemId: number;
    variantId: number;
    productName: string;
    productCode: string;
    size: string;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}
export interface NewOrderInput {
    userId: number;
    receiverName: string;
    receiverPhone: string;
    provinceName: string;
    wardName: string;
    addressDetail: string;
    note: string | null;
    shippingMethodId: number;
    shippingMethodName: string;
    shippingFee: number;
    subtotal: number;
    total: number;
    paymentMethod: PaymentMethod;
    lines: NewOrderLine[];
}
export interface StockShortage {
    variantId: number;
    productName: string;
    size: string;
    available: number;
    requested: number;
}
export declare class StockShortageError extends Error {
    readonly shortages: StockShortage[];
    constructor(shortages: StockShortage[]);
}
export declare class CartChangedError extends Error {
    constructor();
}
export interface LockedOrder {
    id: number;
    code: string;
    userId: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
}
export interface OrderUpdate {
    status?: OrderStatus;
    cancelReason?: string | null;
    paymentStatus?: PaymentStatus;
    paidAt?: Date | null;
}
export interface OrderTransaction {
    order: LockedOrder;
    update(fields: OrderUpdate): Promise<void>;
    addHistory(status: OrderStatus, changedById: number | null, note: string | null): Promise<void>;
    restockItems(): Promise<void>;
    increaseSoldCount(): Promise<void>;
}
export declare class OrderRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    createOrder(input: NewOrderInput): Promise<{
        id: number;
        code: string;
    }>;
    withLockedOrder<T>(where: {
        id: number;
    } | {
        code: string;
        userId: number;
    }, work: (tx: OrderTransaction) => Promise<T>): Promise<T | null>;
    private lockAndVerifyCartLines;
    private insertOrder;
    private createTransaction;
}
