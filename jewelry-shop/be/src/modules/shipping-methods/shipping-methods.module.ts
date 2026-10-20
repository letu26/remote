import { Module } from '@nestjs/common';
import { ShippingMethodAdminController, ShippingMethodController } from './controllers/shipping-method.controllers.js';
import { ShippingMethodRepository } from './repositories/shipping-method.repository.js';
import { ShippingMethodService } from './services/shipping-method.service.js';

@Module({
  controllers: [ShippingMethodController, ShippingMethodAdminController],
  providers: [ShippingMethodService, ShippingMethodRepository],
  exports: [ShippingMethodRepository],
})
export class ShippingMethodsModule {}
