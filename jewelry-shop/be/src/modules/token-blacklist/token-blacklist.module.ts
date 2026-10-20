import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/models/user.entity.js';
import { TokenBlacklist } from './models/token-blacklist.entity.js';
import { TokenBlacklistRepository } from './repositories/token-blacklist.repository.js';
import { TokenBlacklistService } from './services/token-blacklist.service.js';

/** Global để JwtAuthGuard ở mọi module inject được TokenBlacklistService. */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([TokenBlacklist, User])],
  providers: [TokenBlacklistRepository, TokenBlacklistService],
  exports: [TokenBlacklistService],
})
export class TokenBlacklistModule {}
