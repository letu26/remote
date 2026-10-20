import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { BannerQueryDto, CreateBannerDto, UpdateBannerDto } from '../dtos/banner.dtos.js';
import { BannerService } from '../services/banner.service.js';

@Controller('banners')
export class BannerController {
  constructor(private readonly service: BannerService) {}

  @Get()
  list(@Query() query: BannerQueryDto) {
    return this.service.listPublic(query.position);
  }
}

@Controller('admin/banners')
@AdminOnly()
export class BannerAdminController {
  constructor(private readonly service: BannerService) {}

  @Get()
  list() {
    return this.service.listAll();
  }

  @Post()
  create(@Body() dto: CreateBannerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
