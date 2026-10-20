import { Controller, Get } from '@nestjs/common';
import { CatalogService } from '../services/catalog.service.js';

/** API công khai: dữ liệu tra cứu cho menu và bộ lọc. */
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  categories() {
    return this.catalog.getCategoryTree();
  }

  @Get('materials')
  materials() {
    return this.catalog.getMaterials();
  }

  @Get('gemstones')
  gemstones() {
    return this.catalog.getGemstones();
  }

  @Get('collections')
  collections() {
    return this.catalog.getCollections();
  }
}
