import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller.js';
import { Address } from './models/address.entity.js';
import { User } from './models/user.entity.js';
import { UserRepository } from './repositories/user.repository.js';
import { UsersService } from './services/users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Address, User])],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
