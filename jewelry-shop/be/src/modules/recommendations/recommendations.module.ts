import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../guards/optional-jwt-auth.guard.js';
import { AiModule } from '../ai/ai.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { RecommendationController } from './controllers/recommendation.controller.js';
import { RecommendationRepository } from './repositories/recommendation.repository.js';
import { RecommendationAiService } from './services/recommendation-ai.service.js';
import { RecommendationService } from './services/recommendation.service.js';

@Module({
  imports: [AiModule, CatalogModule],
  controllers: [RecommendationController],
  providers: [RecommendationService, RecommendationAiService, RecommendationRepository, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class RecommendationsModule {}
