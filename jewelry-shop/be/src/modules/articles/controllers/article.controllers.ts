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
} from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import {
  AdminArticleListQueryDto,
  ArticleListQueryDto,
  CreateArticleDto,
  UpdateArticleDto,
} from '../dtos/article.dtos.js';
import { ArticleService } from '../services/article.service.js';

@Controller('articles')
export class ArticleController {
  constructor(private readonly service: ArticleService) {}

  @Get()
  list(@Query() query: ArticleListQueryDto) {
    return this.service.listPublic(query);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.service.getPublicBySlug(slug);
  }
}

@Controller('admin/articles')
@AdminOnly()
export class ArticleAdminController {
  constructor(private readonly service: ArticleService) {}

  @Get()
  list(@Query() query: AdminArticleListQueryDto) {
    return this.service.listAdmin(query);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAdmin(id);
  }

  @Post()
  create(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateArticleDto) {
    return this.service.create(admin.id, dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArticleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
