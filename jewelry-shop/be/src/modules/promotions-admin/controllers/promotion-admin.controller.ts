import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CreatePromotionDto, PromotionListQueryDto, UpdatePromotionDto } from '../dtos/promotion.dtos.js';
import { PromotionAdminService } from '../services/promotion-admin.service.js';

@Controller('admin/promotions')
@AdminOnly()
export class PromotionAdminController {
  constructor(private readonly service: PromotionAdminService) {}

  @Get()
  list(@Query() query: PromotionListQueryDto) {
    return this.service.list(query);
  }

  @Post()
  create(@Body() dto: CreatePromotionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePromotionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
