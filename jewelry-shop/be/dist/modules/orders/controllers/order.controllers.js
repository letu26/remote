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
import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, Res, UseGuards, } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { ValidationException } from '../../../exceptions/index.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import { AdminOrderListQueryDto, CancelOrderDto, CreateOrderDto, OrderListQueryDto, PreviewOrderDto, UpdateOrderPaymentDto, UpdateOrderStatusDto, } from '../dtos/order.dtos.js';
import { OrderAdminService } from '../services/order-admin.service.js';
import { OrderService } from '../services/order.service.js';
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
let OrderController = class OrderController {
    service;
    constructor(service) {
        this.service = service;
    }
    preview(user, dto) {
        return this.service.preview(user.id, dto);
    }
    async create(user, idempotencyKey, dto, res) {
        if (!idempotencyKey || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
            throw new ValidationException([
                { field: 'Idempotency-Key', message: 'Header Idempotency-Key là bắt buộc (8-100 ký tự chữ, số, gạch)' },
            ]);
        }
        const { order, created } = await this.service.create(user.id, idempotencyKey, dto);
        res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
        return order;
    }
    list(user, query) {
        return this.service.list(user.id, query);
    }
    detail(user, code) {
        return this.service.detail(user.id, code);
    }
    cancel(user, code, dto) {
        return this.service.cancel(user.id, code, dto);
    }
};
__decorate([
    Post('preview'),
    HttpCode(HttpStatus.OK),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, PreviewOrderDto]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "preview", null);
__decorate([
    Post(),
    __param(0, CurrentUser()),
    __param(1, Headers('idempotency-key')),
    __param(2, Body()),
    __param(3, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, CreateOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, OrderListQueryDto]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "list", null);
__decorate([
    Get(':code'),
    __param(0, CurrentUser()),
    __param(1, Param('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "detail", null);
__decorate([
    Post(':code/cancel'),
    HttpCode(HttpStatus.OK),
    __param(0, CurrentUser()),
    __param(1, Param('code')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, CancelOrderDto]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "cancel", null);
OrderController = __decorate([
    Controller('orders'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [OrderService])
], OrderController);
export { OrderController };
let OrderAdminController = class OrderAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(query) {
        return this.service.list(query);
    }
    detail(id) {
        return this.service.detail(id);
    }
    updateStatus(admin, id, dto) {
        return this.service.updateStatus(id, admin.id, dto);
    }
    updatePayment(admin, id, dto) {
        return this.service.updatePayment(id, admin.id, dto);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AdminOrderListQueryDto]),
    __metadata("design:returntype", void 0)
], OrderAdminController.prototype, "list", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OrderAdminController.prototype, "detail", null);
__decorate([
    Patch(':id/status'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseIntPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, UpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], OrderAdminController.prototype, "updateStatus", null);
__decorate([
    Patch(':id/payment'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseIntPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, UpdateOrderPaymentDto]),
    __metadata("design:returntype", void 0)
], OrderAdminController.prototype, "updatePayment", null);
OrderAdminController = __decorate([
    Controller('admin/orders'),
    AdminOnly(),
    __metadata("design:paramtypes", [OrderAdminService])
], OrderAdminController);
export { OrderAdminController };
//# sourceMappingURL=order.controllers.js.map