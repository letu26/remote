var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module.js';
import { WishlistController } from './controllers/wishlist.controller.js';
import { Wishlist } from './models/wishlist.entity.js';
import { WishlistRepository } from './repositories/wishlist.repository.js';
import { WishlistService } from './services/wishlist.service.js';
let WishlistsModule = class WishlistsModule {
};
WishlistsModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Wishlist]), CatalogModule],
        controllers: [WishlistController],
        providers: [WishlistService, WishlistRepository],
    })
], WishlistsModule);
export { WishlistsModule };
//# sourceMappingURL=wishlists.module.js.map