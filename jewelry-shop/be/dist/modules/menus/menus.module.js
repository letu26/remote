var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { MenuAdminController, MenuController } from './controllers/menu.controllers.js';
import { MenuRepository } from './repositories/menu.repository.js';
import { MenuService } from './services/menu.service.js';
let MenusModule = class MenusModule {
};
MenusModule = __decorate([
    Module({
        controllers: [MenuController, MenuAdminController],
        providers: [MenuService, MenuRepository],
    })
], MenusModule);
export { MenusModule };
//# sourceMappingURL=menus.module.js.map