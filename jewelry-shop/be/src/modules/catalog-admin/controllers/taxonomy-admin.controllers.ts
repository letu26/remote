import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import {
  CreateCategoryDto,
  CreateCollectionDto,
  CreateNamedLookupDto,
  UpdateCategoryDto,
  UpdateCollectionDto,
  UpdateNamedLookupDto,
} from '../dtos/taxonomy-admin.dtos.js';
import { CategoryAdminService } from '../services/category-admin.service.js';
import { CollectionAdminService } from '../services/collection-admin.service.js';
import { LookupAdminService } from '../services/lookup-admin.service.js';

@Controller('admin/categories')
@AdminOnly()
export class CategoryAdminController {
  constructor(private readonly service: CategoryAdminService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

@Controller('admin/materials')
@AdminOnly()
export class MaterialAdminController {
  constructor(private readonly service: LookupAdminService) {}

  @Get()
  list() {
    return this.service.list('materials');
  }

  @Post()
  create(@Body() dto: CreateNamedLookupDto) {
    return this.service.create('materials', dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNamedLookupDto) {
    return this.service.update('materials', id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove('materials', id);
  }
}

@Controller('admin/gemstones')
@AdminOnly()
export class GemstoneAdminController {
  constructor(private readonly service: LookupAdminService) {}

  @Get()
  list() {
    return this.service.list('gemstones');
  }

  @Post()
  create(@Body() dto: CreateNamedLookupDto) {
    return this.service.create('gemstones', dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNamedLookupDto) {
    return this.service.update('gemstones', id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove('gemstones', id);
  }
}

@Controller('admin/collections')
@AdminOnly()
export class CollectionAdminController {
  constructor(private readonly service: CollectionAdminService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCollectionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
