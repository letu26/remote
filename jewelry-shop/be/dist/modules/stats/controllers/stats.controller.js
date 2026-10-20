var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Query } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { LowStockQueryDto, RevenueQueryDto, StatsRangeQueryDto, TopQueryDto } from '../dtos/stats.dtos.js';
import { StatsService } from '../services/stats.service.js';
let StatsController = class StatsController {
    service;
    constructor(service) {
        this.service = service;
    }
    overview(query) {
        return this.service.overview(query);
    }
    revenue(query) {
        return this.service.revenue(query);
    }
    ordersByStatus(query) {
        return this.service.ordersByStatus(query);
    }
    topProducts(query) {
        return this.service.topProducts(query);
    }
    lowStock(query) {
        return this.service.lowStock(query);
    }
    topCustomers(query) {
        return this.service.topCustomers(query);
    }
};
__decorate([
    Get('overview'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StatsRangeQueryDto]),
    __metadata("design:returntype", void 0)
], StatsController.prototype, "overview", null);
__decorate([
    Get('revenue'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RevenueQueryDto]),
    __metadata("design:returntype", void 0)
], StatsController.prototype, "revenue", null);
__decorate([
    Get('orders-by-status'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StatsRangeQueryDto]),
    __metadata("design:returntype", void 0)
], StatsController.prototype, "ordersByStatus", null);
__decorate([
    Get('top-products'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TopQueryDto]),
    __metadata("design:returntype", void 0)
], StatsController.prototype, "topProducts", null);
__decorate([
    Get('low-stock'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LowStockQueryDto]),
    __metadata("design:returntype", void 0)
], StatsController.prototype, "lowStock", null);
__decorate([
    Get('top-customers'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TopQueryDto]),
    __metadata("design:returntype", void 0)
], StatsController.prototype, "topCustomers", null);
StatsController = __decorate([
    Controller('admin/stats'),
    AdminOnly(),
    __metadata("design:paramtypes", [StatsService])
], StatsController);
export { StatsController };
//# sourceMappingURL=stats.controller.js.map