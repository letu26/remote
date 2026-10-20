import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import { CreateShippingMethodDto, UpdateShippingMethodDto } from '../dtos/shipping-method.dtos.js';
import { ShippingMethodService } from '../services/shipping-method.service.js';

@Controller('shipping-methods')
@UseGuards(JwtAuthGuard)
export class ShippingMethodController {
  constructor(private readonly service: ShippingMethodService) {}

  @Get()
  list() {
    return this.service.listPublic();
  }
}

@Controller('admin/shipping-methods')
@AdminOnly()
export class ShippingMethodAdminController {
  constructor(private readonly service: ShippingMethodService) {}

  @Get()
  list() {
    return this.service.listAll();
  }

  @Post()
  create(@Body() dto: CreateShippingMethodDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShippingMethodDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
