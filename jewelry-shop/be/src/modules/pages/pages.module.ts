import { Module } from '@nestjs/common';
import { PageAdminController, PageController } from './controllers/page.controllers.js';
import { PageRepository } from './repositories/page.repository.js';
import { PageService } from './services/page.service.js';

@Module({
  controllers: [PageController, PageAdminController],
  providers: [PageService, PageRepository],
})
export class PagesModule {}
