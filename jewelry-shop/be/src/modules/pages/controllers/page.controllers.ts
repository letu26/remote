import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CreatePageDto, UpdatePageDto } from '../dtos/page.dtos.js';
import { PageService } from '../services/page.service.js';

@Controller('pages')
export class PageController {
  constructor(private readonly service: PageService) {}

  @Get()
  list() {
    return this.service.listPublic();
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.service.getPublic(slug);
  }
}

@Controller('admin/pages')
@AdminOnly()
export class PageAdminController {
  constructor(private readonly service: PageService) {}

  @Get()
  list() {
    return this.service.listAdmin();
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAdmin(id);
  }

  @Post()
  create(@Body() dto: CreatePageDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePageDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
