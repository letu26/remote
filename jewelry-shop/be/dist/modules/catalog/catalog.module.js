var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './controllers/catalog.controller.js';
import { ProductsController } from './controllers/products.controller.js';
import { Category } from './models/category.entity.js';
import { Collection } from './models/collection.entity.js';
import { Gemstone } from './models/gemstone.entity.js';
import { Material } from './models/material.entity.js';
import { ProductGemstone } from './models/product-gemstone.entity.js';
import { ProductImage } from './models/product-image.entity.js';
import { ProductVariant } from './models/product-variant.entity.js';
import { Product } from './models/product.entity.js';
import { CatalogCacheRepository } from './repositories/catalog-cache.repository.js';
import { CatalogLookupRepository } from './repositories/catalog-lookup.repository.js';
import { ProductQueryRepository } from './repositories/product-query.repository.js';
import { CatalogService } from './services/catalog.service.js';
import { ProductCatalogService } from './services/product-catalog.service.js';
let CatalogModule = class CatalogModule {
};
CatalogModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forFeature([Category, Collection, Gemstone, Material, ProductGemstone, ProductImage, ProductVariant, Product]),
        ],
        controllers: [CatalogController, ProductsController],
        providers: [CatalogService, ProductCatalogService, CatalogLookupRepository, CatalogCacheRepository, ProductQueryRepository],
        exports: [TypeOrmModule, CatalogCacheRepository, CatalogService, ProductCatalogService, ProductQueryRepository],
    })
], CatalogModule);
export { CatalogModule };
//# sourceMappingURL=catalog.module.js.map