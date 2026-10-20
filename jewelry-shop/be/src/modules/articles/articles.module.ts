import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { ArticleAdminController, ArticleController } from './controllers/article.controllers.js';
import { ArticleRepository } from './repositories/article.repository.js';
import { ArticleService } from './services/article.service.js';

@Module({
  imports: [MediaModule],
  controllers: [ArticleController, ArticleAdminController],
  providers: [ArticleService, ArticleRepository],
})
export class ArticlesModule {}
