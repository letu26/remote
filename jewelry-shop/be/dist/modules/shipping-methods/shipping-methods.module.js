var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ShippingMethodAdminController, ShippingMethodController } from './controllers/shipping-method.controllers.js';
import { ShippingMethodRepository } from './repositories/shipping-method.repository.js';
import { ShippingMethodService } from './services/shipping-method.service.js';
let ShippingMethodsModule = class ShippingMethodsModule {
};
ShippingMethodsModule = __decorate([
    Module({
        controllers: [ShippingMethodController, ShippingMethodAdminController],
        providers: [ShippingMethodService, ShippingMethodRepository],
        exports: [ShippingMethodRepository],
    })
], ShippingMethodsModule);
export { ShippingMethodsModule };
//# sourceMappingURL=shipping-methods.module.js.map