import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { CustomerListQueryDto, UpdateCustomerRoleDto, UpdateCustomerStatusDto } from '../dtos/customer.dtos.js';
import { CustomerAdminService } from '../services/customer-admin.service.js';

@Controller('admin/customers')
@AdminOnly()
export class CustomerAdminController {
  constructor(private readonly service: CustomerAdminService) {}

  @Get()
  list(@Query() query: CustomerListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerStatusDto,
  ) {
    return this.service.updateStatus(admin.id, id, dto);
  }

  @Patch(':id/role')
  updateRole(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerRoleDto,
  ) {
    return this.service.updateRole(admin.id, id, dto);
  }
}
