import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { BannerAdminController, BannerController } from './controllers/banner.controllers.js';
import { BannerRepository } from './repositories/banner.repository.js';
import { BannerService } from './services/banner.service.js';

@Module({
  imports: [MediaModule],
  controllers: [BannerController, BannerAdminController],
  providers: [BannerService, BannerRepository],
})
export class BannersModule {}
