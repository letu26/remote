var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module.js';
import { CartController } from './controllers/cart.controller.js';
import { CartItem } from './models/cart-item.entity.js';
import { Cart } from './models/cart.entity.js';
import { CartRepository } from './repositories/cart.repository.js';
import { CartService } from './services/cart.service.js';
let CartModule = class CartModule {
};
CartModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([CartItem, Cart]), CatalogModule],
        controllers: [CartController],
        providers: [CartService, CartRepository],
        exports: [CartService, CartRepository],
    })
], CartModule);
export { CartModule };
//# sourceMappingURL=cart.module.js.map