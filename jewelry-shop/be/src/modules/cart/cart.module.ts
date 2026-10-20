import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module.js';
import { CartController } from './controllers/cart.controller.js';
import { CartItem } from './models/cart-item.entity.js';
import { Cart } from './models/cart.entity.js';
import { CartRepository } from './repositories/cart.repository.js';
import { CartService } from './services/cart.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem, Cart]), CatalogModule],
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartService, CartRepository],
})
export class CartModule {}
