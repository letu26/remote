var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let ReviewsModule = class ReviewsModule {
};
ReviewsModule = __decorate([
    Module({
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
], ReviewsModule);
export { ReviewsModule };
//# sourceMappingURL=reviews.module.js.map