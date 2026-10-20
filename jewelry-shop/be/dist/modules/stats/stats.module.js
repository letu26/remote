var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { StatsController } from './controllers/stats.controller.js';
import { StatsRepository } from './repositories/stats.repository.js';
import { StatsService } from './services/stats.service.js';
let StatsModule = class StatsModule {
};
StatsModule = __decorate([
    Module({
        controllers: [StatsController],
        providers: [StatsService, StatsRepository],
    })
], StatsModule);
export { StatsModule };
//# sourceMappingURL=stats.module.js.map