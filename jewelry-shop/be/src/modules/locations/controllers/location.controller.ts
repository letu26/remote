import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { LocationService } from '../services/location.service.js';

/** API công khai: tỉnh/thành -> xã/phường (sau sáp nhập, 2 cấp). */
@Controller('locations/provinces')
export class LocationController {
  constructor(private readonly service: LocationService) {}

  @Get()
  provinces() {
    return this.service.getProvinces();
  }

  @Get(':provinceId/wards')
  wards(@Param('provinceId', ParseIntPipe) provinceId: number) {
    return this.service.getWards(provinceId);
  }
}
