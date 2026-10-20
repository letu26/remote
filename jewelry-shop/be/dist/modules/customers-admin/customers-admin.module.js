var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { CustomerAdminController } from './controllers/customer-admin.controller.js';
import { CustomerAdminRepository } from './repositories/customer-admin.repository.js';
import { CustomerAdminService } from './services/customer-admin.service.js';
let CustomersAdminModule = class CustomersAdminModule {
};
CustomersAdminModule = __decorate([
    Module({
        controllers: [CustomerAdminController],
        providers: [CustomerAdminService, CustomerAdminRepository],
    })
], CustomersAdminModule);
export { CustomersAdminModule };
//# sourceMappingURL=customers-admin.module.js.map