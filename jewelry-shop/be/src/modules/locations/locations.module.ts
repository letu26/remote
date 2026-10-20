import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from './controllers/location.controller.js';
import { Province } from './models/province.entity.js';
import { Ward } from './models/ward.entity.js';
import { LocationCacheRepository } from './repositories/location-cache.repository.js';
import { LocationRepository } from './repositories/location.repository.js';
import { LocationService } from './services/location.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Province, Ward])],
  controllers: [LocationController],
  providers: [LocationService, LocationRepository, LocationCacheRepository],
  exports: [LocationRepository],
})
export class LocationsModule {}
