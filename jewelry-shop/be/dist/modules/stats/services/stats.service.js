var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ValidationException } from '../../../exceptions/index.js';
import { addDaysIso, buildPeriods, firstDayOfMonthIso, firstDayOfNextMonthIso, MAX_PERIODS, resolveStatsRange, vietnamDayStartUtc, vietnamIsoDate, } from '../../../utils/vietnam-time.util.js';
import { StatsRepository } from '../repositories/stats.repository.js';
const DEFAULT_LOW_STOCK_THRESHOLD = 5;
const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'];
let StatsService = class StatsService {
    stats;
    constructor(stats) {
        this.stats = stats;
    }
    async overview(query) {
        const now = new Date();
        const range = this.range(query, now);
        const todayIso = vietnamIsoDate(now);
        const [pendingOrders, today, thisMonth, inRange, totalCustomers, totalProducts, lowStockProducts] = await Promise.all([
            this.stats.countPendingOrders(),
            this.stats.deliveredAggregate(vietnamDayStartUtc(todayIso), vietnamDayStartUtc(addDaysIso(todayIso, 1))),
            this.stats.deliveredAggregate(vietnamDayStartUtc(firstDayOfMonthIso(todayIso)), vietnamDayStartUtc(firstDayOfNextMonthIso(todayIso))),
            this.stats.deliveredAggregate(range.startUtc, range.endUtcExclusive),
            this.stats.countCustomers(),
            this.stats.countActiveProducts(),
            this.stats.countLowStockProducts(DEFAULT_LOW_STOCK_THRESHOLD),
        ]);
        return {
            range: { from: range.from, to: range.to },
            pendingOrders,
            today,
            thisMonth,
            inRange: {
                ...inRange,
                averageOrderValue: inRange.orders ? Math.round(inRange.revenue / inRange.orders) : 0,
            },
            totalCustomers,
            totalProducts,
            lowStockProducts,
        };
    }
    async revenue(query) {
        const range = this.range(query, new Date());
        const granularity = query.granularity ?? 'day';
        const periods = buildPeriods(granularity, range.from, range.to);
        if (periods.length > MAX_PERIODS[granularity]) {
            throw new ValidationException([
                { field: 'granularity', message: `Tối đa ${MAX_PERIODS[granularity]} kỳ theo ${granularity}, hãy thu hẹp khoảng ngày` },
            ]);
        }
        const points = await this.stats.revenueByPeriod(granularity, range.startUtc, range.endUtcExclusive);
        const byPeriod = new Map(points.map((point) => [point.period, point]));
        return periods.map((period) => byPeriod.get(period) ?? { period, orders: 0, revenue: 0 });
    }
    async ordersByStatus(query) {
        const range = this.range(query, new Date());
        const counts = await this.stats.countOrdersByStatus(range.startUtc, range.endUtcExclusive);
        return Object.fromEntries(ORDER_STATUSES.map((status) => [status, counts.get(status) ?? 0]));
    }
    topProducts(query) {
        const range = this.range(query, new Date());
        return this.stats.topProducts(range.startUtc, range.endUtcExclusive, query.limit ?? 10);
    }
    lowStock(query) {
        return this.stats.lowStock(query.threshold ?? DEFAULT_LOW_STOCK_THRESHOLD, query.limit ?? 20);
    }
    topCustomers(query) {
        const range = this.range(query, new Date());
        return this.stats.topCustomers(range.startUtc, range.endUtcExclusive, query.limit ?? 10);
    }
    range(query, now) {
        const result = resolveStatsRange(query.from, query.to, now);
        if (!result.ok)
            throw new ValidationException(result.errors);
        return result.range;
    }
};
StatsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [StatsRepository])
], StatsService);
export { StatsService };
//# sourceMappingURL=stats.service.js.map