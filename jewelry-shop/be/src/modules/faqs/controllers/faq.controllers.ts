import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CreateFaqDto, UpdateFaqDto } from '../dtos/faq.dtos.js';
import { FaqService } from '../services/faq.service.js';

@Controller('faqs')
export class FaqController {
  constructor(private readonly service: FaqService) {}

  @Get()
  list() {
    return this.service.listPublic();
  }
}

@Controller('admin/faqs')
@AdminOnly()
export class FaqAdminController {
  constructor(private readonly service: FaqService) {}

  @Get()
  list() {
    return this.service.listAll();
  }

  @Post()
  create(@Body() dto: CreateFaqDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFaqDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
