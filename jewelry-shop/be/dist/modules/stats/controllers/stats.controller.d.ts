import { LowStockQueryDto, RevenueQueryDto, StatsRangeQueryDto, TopQueryDto } from '../dtos/stats.dtos.js';
import { StatsService } from '../services/stats.service.js';
export declare class StatsController {
    private readonly service;
    constructor(service: StatsService);
    overview(query: StatsRangeQueryDto): Promise<{
        range: {
            from: string;
            to: string;
        };
        pendingOrders: number;
        today: import("../repositories/stats.repository.js").DeliveredAggregate;
        thisMonth: import("../repositories/stats.repository.js").DeliveredAggregate;
        inRange: {
            averageOrderValue: number;
            orders: number;
            revenue: number;
        };
        totalCustomers: number;
        totalProducts: number;
        lowStockProducts: number;
    }>;
    revenue(query: RevenueQueryDto): Promise<import("../repositories/stats.repository.js").RevenuePoint[]>;
    ordersByStatus(query: StatsRangeQueryDto): Promise<{
        [k: string]: number;
    }>;
    topProducts(query: TopQueryDto): Promise<import("../repositories/stats.repository.js").TopProductRow[]>;
    lowStock(query: LowStockQueryDto): Promise<import("../repositories/stats.repository.js").LowStockRow[]>;
    topCustomers(query: TopQueryDto): Promise<import("../repositories/stats.repository.js").TopCustomerRow[]>;
}
