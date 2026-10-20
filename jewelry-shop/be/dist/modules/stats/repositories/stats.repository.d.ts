import { DataSource } from 'typeorm';
import type { Granularity } from '../../../utils/vietnam-time.util.js';
export interface DeliveredAggregate {
    orders: number;
    revenue: number;
}
export interface RevenuePoint {
    period: string;
    orders: number;
    revenue: number;
}
export interface TopProductRow {
    productCode: string;
    productName: string;
    productId: number | null;
    productSlug: string | null;
    quantity: number;
    revenue: number;
}
export interface LowStockRow {
    productId: number;
    productCode: string;
    productName: string;
    variantId: number;
    sku: string;
    size: string;
    stock: number;
}
export interface TopCustomerRow {
    userId: number;
    fullName: string;
    phone: string;
    orders: number;
    totalSpent: number;
}
export declare class StatsRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    countPendingOrders(): Promise<number>;
    countCustomers(): Promise<number>;
    countActiveProducts(): Promise<number>;
    countLowStockProducts(threshold: number): Promise<number>;
    deliveredAggregate(startUtc: Date, endUtcExclusive: Date): Promise<DeliveredAggregate>;
    revenueByPeriod(granularity: Granularity, startUtc: Date, endUtcExclusive: Date): Promise<RevenuePoint[]>;
    countOrdersByStatus(startUtc: Date, endUtcExclusive: Date): Promise<Map<string, number>>;
    topProducts(startUtc: Date, endUtcExclusive: Date, limit: number): Promise<TopProductRow[]>;
    lowStock(threshold: number, limit: number): Promise<LowStockRow[]>;
    topCustomers(startUtc: Date, endUtcExclusive: Date, limit: number): Promise<TopCustomerRow[]>;
    explain(sql: string, params: unknown[]): Promise<unknown[]>;
    private count;
}
