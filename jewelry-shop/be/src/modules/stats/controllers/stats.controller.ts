import { Controller, Get, Query } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { LowStockQueryDto, RevenueQueryDto, StatsRangeQueryDto, TopQueryDto } from '../dtos/stats.dtos.js';
import { StatsService } from '../services/stats.service.js';

@Controller('admin/stats')
@AdminOnly()
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('overview')
  overview(@Query() query: StatsRangeQueryDto) {
    return this.service.overview(query);
  }

  @Get('revenue')
  revenue(@Query() query: RevenueQueryDto) {
    return this.service.revenue(query);
  }

  @Get('orders-by-status')
  ordersByStatus(@Query() query: StatsRangeQueryDto) {
    return this.service.ordersByStatus(query);
  }

  @Get('top-products')
  topProducts(@Query() query: TopQueryDto) {
    return this.service.topProducts(query);
  }

  @Get('low-stock')
  lowStock(@Query() query: LowStockQueryDto) {
    return this.service.lowStock(query);
  }

  @Get('top-customers')
  topCustomers(@Query() query: TopQueryDto) {
    return this.service.topCustomers(query);
  }
}
