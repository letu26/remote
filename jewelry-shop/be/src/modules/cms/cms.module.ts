import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './models/article.entity.js';
import { Banner } from './models/banner.entity.js';
import { Faq } from './models/faq.entity.js';
import { Menu } from './models/menu.entity.js';
import { Page } from './models/page.entity.js';
import { SiteSetting } from './models/site-setting.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Banner, Faq, Menu, Page, SiteSetting])],
})
export class CmsModule {}
