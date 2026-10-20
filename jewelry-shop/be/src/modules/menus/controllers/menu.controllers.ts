import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CreateMenuDto, MenuQueryDto, UpdateMenuDto } from '../dtos/menu.dtos.js';
import { MenuService } from '../services/menu.service.js';

@Controller('menus')
export class MenuController {
  constructor(private readonly service: MenuService) {}

  @Get()
  tree(@Query() query: MenuQueryDto) {
    return this.service.getTree(query.placement);
  }
}

@Controller('admin/menus')
@AdminOnly()
export class MenuAdminController {
  constructor(private readonly service: MenuService) {}

  @Get()
  list() {
    return this.service.listAll();
  }

  @Post()
  create(@Body() dto: CreateMenuDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
