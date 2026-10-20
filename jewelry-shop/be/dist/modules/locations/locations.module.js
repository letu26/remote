var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from './controllers/location.controller.js';
import { Province } from './models/province.entity.js';
import { Ward } from './models/ward.entity.js';
import { LocationCacheRepository } from './repositories/location-cache.repository.js';
import { LocationRepository } from './repositories/location.repository.js';
import { LocationService } from './services/location.service.js';
let LocationsModule = class LocationsModule {
};
LocationsModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Province, Ward])],
        controllers: [LocationController],
        providers: [LocationService, LocationRepository, LocationCacheRepository],
        exports: [LocationRepository],
    })
], LocationsModule);
export { LocationsModule };
//# sourceMappingURL=locations.module.js.map