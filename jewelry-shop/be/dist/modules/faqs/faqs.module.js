var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { FaqAdminController, FaqController } from './controllers/faq.controllers.js';
import { FaqRepository } from './repositories/faq.repository.js';
import { FaqService } from './services/faq.service.js';
let FaqsModule = class FaqsModule {
};
FaqsModule = __decorate([
    Module({
        controllers: [FaqController, FaqAdminController],
        providers: [FaqService, FaqRepository],
        exports: [FaqRepository],
    })
], FaqsModule);
export { FaqsModule };
//# sourceMappingURL=faqs.module.js.map