var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller.js';
import { Address } from './models/address.entity.js';
import { User } from './models/user.entity.js';
import { UserRepository } from './repositories/user.repository.js';
import { UsersService } from './services/users.service.js';
let UsersModule = class UsersModule {
};
UsersModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Address, User])],
        controllers: [UsersController],
        providers: [UsersService, UserRepository],
        exports: [UsersService, UserRepository],
    })
], UsersModule);
export { UsersModule };
//# sourceMappingURL=users.module.js.map