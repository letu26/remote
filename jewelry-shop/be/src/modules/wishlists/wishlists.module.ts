import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module.js';
import { WishlistController } from './controllers/wishlist.controller.js';
import { Wishlist } from './models/wishlist.entity.js';
import { WishlistRepository } from './repositories/wishlist.repository.js';
import { WishlistService } from './services/wishlist.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist]), CatalogModule],
  controllers: [WishlistController],
  providers: [WishlistService, WishlistRepository],
})
export class WishlistsModule {}
