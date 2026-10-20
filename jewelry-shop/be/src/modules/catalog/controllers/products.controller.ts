import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductListQueryDto } from '../dtos/product-query.dto.js';
import { ProductCatalogService } from '../services/product-catalog.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductCatalogService) {}

  @Get()
  list(@Query() query: ProductListQueryDto) {
    return this.products.list(query);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.products.getBySlug(slug);
  }
}
