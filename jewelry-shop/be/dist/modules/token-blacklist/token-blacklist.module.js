var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/models/user.entity.js';
import { TokenBlacklist } from './models/token-blacklist.entity.js';
import { TokenBlacklistRepository } from './repositories/token-blacklist.repository.js';
import { TokenBlacklistService } from './services/token-blacklist.service.js';
let TokenBlacklistModule = class TokenBlacklistModule {
};
TokenBlacklistModule = __decorate([
    Global(),
    Module({
        imports: [TypeOrmModule.forFeature([TokenBlacklist, User])],
        providers: [TokenBlacklistRepository, TokenBlacklistService],
        exports: [TokenBlacklistService],
    })
], TokenBlacklistModule);
export { TokenBlacklistModule };
//# sourceMappingURL=token-blacklist.module.js.map