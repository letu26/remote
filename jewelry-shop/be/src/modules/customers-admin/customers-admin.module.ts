import { Module } from '@nestjs/common';
import { CustomerAdminController } from './controllers/customer-admin.controller.js';
import { CustomerAdminRepository } from './repositories/customer-admin.repository.js';
import { CustomerAdminService } from './services/customer-admin.service.js';

/** Quản lý tài khoản (khóa/mở khóa, đổi quyền). TokenBlacklistService là provider global. */
@Module({
  controllers: [CustomerAdminController],
  providers: [CustomerAdminService, CustomerAdminRepository],
})
export class CustomersAdminModule {}
