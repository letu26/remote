import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module.js';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../guards/optional-jwt-auth.guard.js';
import { ReviewAdminController, ReviewController } from './controllers/review.controllers.js';
import { Review } from './models/review.entity.js';
import { ReviewQueryRepository } from './repositories/review-query.repository.js';
import { ReviewRepository } from './repositories/review.repository.js';
import { ReviewAdminService } from './services/review-admin.service.js';
import { ReviewService } from './services/review.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Review]), CatalogModule],
  controllers: [ReviewController, ReviewAdminController],
  providers: [
    ReviewService,
    ReviewAdminService,
    ReviewRepository,
    ReviewQueryRepository,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
  ],
})
export class ReviewsModule {}
