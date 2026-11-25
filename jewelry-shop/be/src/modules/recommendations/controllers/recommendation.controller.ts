import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OptionalJwtAuthGuard } from '../../../guards/optional-jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { RecommendationDto } from '../dtos/recommendation.dtos.js';
import { RecommendationService } from '../services/recommendation.service.js';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly service: RecommendationService) {}

  /** POST vì lịch sử xem gửi trong thân request; không ghi gì vào hệ thống. */
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  recommend(@Req() req: Request & { user?: AuthenticatedUser }, @Body() dto: RecommendationDto) {
    return this.service.recommend(req.user?.id ?? null, dto);
  }
}
