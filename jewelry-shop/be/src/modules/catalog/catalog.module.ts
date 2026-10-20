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

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Collection, Gemstone, Material, ProductGemstone, ProductImage, ProductVariant, Product]),
  ],
  controllers: [CatalogController, ProductsController],
  providers: [CatalogService, ProductCatalogService, CatalogLookupRepository, CatalogCacheRepository, ProductQueryRepository],
  exports: [TypeOrmModule, CatalogCacheRepository, CatalogService, ProductCatalogService, ProductQueryRepository],
})
export class CatalogModule {}
