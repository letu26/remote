import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { SiteInfoAdminController, SiteInfoController } from './controllers/site-info.controllers.js';
import { SiteInfoService } from './services/site-info.service.js';

@Module({
  imports: [SettingsModule],
  controllers: [SiteInfoController, SiteInfoAdminController],
  providers: [SiteInfoService],
  exports: [SiteInfoService],
})
export class SiteInfoModule {}
