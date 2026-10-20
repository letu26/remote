var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressesModule } from '../addresses/addresses.module.js';
import { CartModule } from '../cart/cart.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { ShippingMethodsModule } from '../shipping-methods/shipping-methods.module.js';
import { OrderAdminController, OrderController } from './controllers/order.controllers.js';
import { OrderItem } from './models/order-item.entity.js';
import { OrderStatusHistory } from './models/order-status-history.entity.js';
import { Order } from './models/order.entity.js';
import { ShippingMethod } from './models/shipping-method.entity.js';
import { IdempotencyRepository } from './repositories/idempotency.repository.js';
import { OrderQueryRepository } from './repositories/order-query.repository.js';
import { OrderRepository } from './repositories/order.repository.js';
import { OrderAdminService } from './services/order-admin.service.js';
import { OrderPricingService } from './services/order-pricing.service.js';
import { OrderViewService } from './services/order-view.service.js';
import { OrderService } from './services/order.service.js';
let OrdersModule = class OrdersModule {
};
OrdersModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forFeature([OrderItem, OrderStatusHistory, Order, ShippingMethod]),
            AddressesModule,
            CartModule,
            CatalogModule,
            PaymentsModule,
            ShippingMethodsModule,
        ],
        controllers: [OrderController, OrderAdminController],
        providers: [
            OrderService,
            OrderAdminService,
            OrderPricingService,
            OrderViewService,
            OrderRepository,
            OrderQueryRepository,
            IdempotencyRepository,
        ],
    })
], OrdersModule);
export { OrdersModule };
//# sourceMappingURL=orders.module.js.map