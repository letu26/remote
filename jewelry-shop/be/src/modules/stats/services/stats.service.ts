import { Injectable } from '@nestjs/common';
import { ValidationException } from '../../../exceptions/index.js';
import {
  addDaysIso,
  buildPeriods,
  firstDayOfMonthIso,
  firstDayOfNextMonthIso,
  type Granularity,
  MAX_PERIODS,
  resolveStatsRange,
  type StatsRange,
  vietnamDayStartUtc,
  vietnamIsoDate,
} from '../../../utils/vietnam-time.util.js';
import type { LowStockQueryDto, RevenueQueryDto, StatsRangeQueryDto, TopQueryDto } from '../dtos/stats.dtos.js';
import { StatsRepository } from '../repositories/stats.repository.js';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;
const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'] as const;

@Injectable()
export class StatsService {
  constructor(private readonly stats: StatsRepository) {}

  async overview(query: StatsRangeQueryDto) {
    const now = new Date();
    const range = this.range(query, now);
    const todayIso = vietnamIsoDate(now);
    const [pendingOrders, today, thisMonth, inRange, totalCustomers, totalProducts, lowStockProducts] = await Promise.all([
      this.stats.countPendingOrders(),
      this.stats.deliveredAggregate(vietnamDayStartUtc(todayIso), vietnamDayStartUtc(addDaysIso(todayIso, 1))),
      this.stats.deliveredAggregate(
        vietnamDayStartUtc(firstDayOfMonthIso(todayIso)),
        vietnamDayStartUtc(firstDayOfNextMonthIso(todayIso)),
      ),
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

  async revenue(query: RevenueQueryDto) {
    const range = this.range(query, new Date());
    const granularity: Granularity = query.granularity ?? 'day';
    const periods = buildPeriods(granularity, range.from, range.to);
    if (periods.length > MAX_PERIODS[granularity]) {
      throw new ValidationException([
        { field: 'granularity', message: `Tối đa ${MAX_PERIODS[granularity]} kỳ theo ${granularity}, hãy thu hẹp khoảng ngày` },
      ]);
    }
    const points = await this.stats.revenueByPeriod(granularity, range.startUtc, range.endUtcExclusive);
    const byPeriod = new Map(points.map((point) => [point.period, point]));
    // Điền đủ các kỳ không có đơn bằng 0.
    return periods.map((period) => byPeriod.get(period) ?? { period, orders: 0, revenue: 0 });
  }

  async ordersByStatus(query: StatsRangeQueryDto) {
    const range = this.range(query, new Date());
    const counts = await this.stats.countOrdersByStatus(range.startUtc, range.endUtcExclusive);
    return Object.fromEntries(ORDER_STATUSES.map((status) => [status, counts.get(status) ?? 0]));
  }

  topProducts(query: TopQueryDto) {
    const range = this.range(query, new Date());
    return this.stats.topProducts(range.startUtc, range.endUtcExclusive, query.limit ?? 10);
  }

  lowStock(query: LowStockQueryDto) {
    return this.stats.lowStock(query.threshold ?? DEFAULT_LOW_STOCK_THRESHOLD, query.limit ?? 20);
  }

  topCustomers(query: TopQueryDto) {
    const range = this.range(query, new Date());
    return this.stats.topCustomers(range.startUtc, range.endUtcExclusive, query.limit ?? 10);
  }

  private range(query: StatsRangeQueryDto, now: Date): StatsRange {
    const result = resolveStatsRange(query.from, query.to, now);
    if (!result.ok) throw new ValidationException(result.errors);
    return result.range;
  }
}
