import { Module } from '@nestjs/common';
import { MenuAdminController, MenuController } from './controllers/menu.controllers.js';
import { MenuRepository } from './repositories/menu.repository.js';
import { MenuService } from './services/menu.service.js';

@Module({
  controllers: [MenuController, MenuAdminController],
  providers: [MenuService, MenuRepository],
})
export class MenusModule {}
