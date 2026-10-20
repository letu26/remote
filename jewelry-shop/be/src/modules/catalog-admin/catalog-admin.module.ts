import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { MediaModule } from '../media/media.module.js';
import { ProductAdminController, ProductImageAdminController } from './controllers/product-admin.controllers.js';
import {
  CategoryAdminController,
  CollectionAdminController,
  GemstoneAdminController,
  MaterialAdminController,
} from './controllers/taxonomy-admin.controllers.js';
import { ImageUploadInterceptor } from './interceptors/image-upload.interceptor.js';
import { CategoryAdminRepository } from './repositories/category-admin.repository.js';
import { CollectionAdminRepository } from './repositories/collection-admin.repository.js';
import { LookupAdminRepository } from './repositories/lookup-admin.repository.js';
import { ProductAdminRepository } from './repositories/product-admin.repository.js';
import { ProductImageRepository } from './repositories/product-image.repository.js';
import { CategoryAdminService } from './services/category-admin.service.js';
import { CollectionAdminService } from './services/collection-admin.service.js';
import { LookupAdminService } from './services/lookup-admin.service.js';
import { ProductAdminService } from './services/product-admin.service.js';
import { ProductImageService } from './services/product-image.service.js';

/** API quản trị danh mục, chất liệu, loại đá, bộ sưu tập, sản phẩm và ảnh sản phẩm. */
@Module({
  imports: [CatalogModule, MediaModule],
  controllers: [
    CategoryAdminController,
    MaterialAdminController,
    GemstoneAdminController,
    CollectionAdminController,
    ProductAdminController,
    ProductImageAdminController,
  ],
  providers: [
    ImageUploadInterceptor,
    CategoryAdminRepository,
    CollectionAdminRepository,
    LookupAdminRepository,
    ProductAdminRepository,
    ProductImageRepository,
    CategoryAdminService,
    CollectionAdminService,
    LookupAdminService,
    ProductAdminService,
    ProductImageService,
  ],
})
export class CatalogAdminModule {}
