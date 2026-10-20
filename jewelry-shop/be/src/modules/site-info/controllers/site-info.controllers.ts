import { Body, Controller, Get, Put } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { SiteInfoDto } from '../dtos/site-info.dtos.js';
import { SiteInfoService } from '../services/site-info.service.js';

@Controller('site-info')
export class SiteInfoController {
  constructor(private readonly service: SiteInfoService) {}

  @Get()
  get() {
    return this.service.get();
  }
}

@Controller('admin/settings/site-info')
@AdminOnly()
export class SiteInfoAdminController {
  constructor(private readonly service: SiteInfoService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @Put()
  save(@Body() dto: SiteInfoDto) {
    return this.service.save(dto);
  }
}
