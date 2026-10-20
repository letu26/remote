import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../../guards/optional-jwt-auth.guard.js';
import { PageQueryDto } from '../../../utils/pagination.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import {
  AdminReviewListQueryDto,
  CreateReviewDto,
  ReviewListQueryDto,
  UpdateReviewDto,
  UpdateReviewVisibilityDto,
} from '../dtos/review.dtos.js';
import { ReviewAdminService } from '../services/review-admin.service.js';
import { ReviewService } from '../services/review.service.js';

@Controller()
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  /** Công khai; token tùy chọn chỉ để đặt isMine. */
  @Get('products/:slug/reviews')
  @UseGuards(OptionalJwtAuthGuard)
  list(@Param('slug') slug: string, @Query() query: ReviewListQueryDto, @Req() req: Request & { user?: AuthenticatedUser }) {
    return this.service.listForProduct(slug, query, req.user?.id ?? null);
  }

  @Get('products/:slug/my-review')
  @UseGuards(JwtAuthGuard)
  myReview(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.service.getMyReview(user.id, slug);
  }

  @Post('products/:slug/reviews')
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string, @Body() dto: CreateReviewDto) {
    return this.service.create(user.id, slug, dto);
  }

  /** Khai báo trước ':id' để 'me' không bị coi là id. */
  @Get('reviews/me')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthenticatedUser, @Query() query: PageQueryDto) {
    return this.service.listMine(user.id, query);
  }

  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReviewDto) {
    return this.service.update(user.id, id, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(user.id, id);
  }
}

@Controller('admin/reviews')
@AdminOnly()
export class ReviewAdminController {
  constructor(private readonly service: ReviewAdminService) {}

  @Get()
  list(@Query() query: AdminReviewListQueryDto) {
    return this.service.list(query);
  }

  @Patch(':id/visibility')
  setVisibility(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReviewVisibilityDto) {
    return this.service.setVisibility(id, dto.isHidden);
  }
}
