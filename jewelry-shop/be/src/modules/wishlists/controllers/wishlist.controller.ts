import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import { PageQueryDto } from '../../../utils/pagination.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { AddWishlistDto } from '../dtos/wishlist.dtos.js';
import { WishlistService } from '../services/wishlist.service.js';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: PageQueryDto) {
    return this.service.list(user.id, query);
  }

  @Get('ids')
  ids(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listIds(user.id);
  }

  /** 201 khi vừa thêm, 200 khi đã có sẵn (idempotent). */
  @Post()
  async add(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddWishlistDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { productId, created } = await this.service.add(user.id, dto.productId);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return { productId };
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('productId', ParseIntPipe) productId: number) {
    return this.service.remove(user.id, productId);
  }
}
