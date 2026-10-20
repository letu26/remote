import { Module } from '@nestjs/common';
import { AddressController } from './controllers/address.controller.js';
import { AddressRepository } from './repositories/address.repository.js';
import { AddressService } from './services/address.service.js';

@Module({
  controllers: [AddressController],
  providers: [AddressService, AddressRepository],
  exports: [AddressService, AddressRepository],
})
export class AddressesModule {}
