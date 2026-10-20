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
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { AddCartItemDto, RemoveCartItemsDto, UpdateCartItemDto } from '../dtos/cart.dtos.js';
import { CartService } from '../services/cart.service.js';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getCart(user.id);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.service.summary(user.id);
  }

  @Post('items')
  add(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddCartItemDto) {
    return this.service.addItem(user.id, dto.variantId, dto.quantity);
  }

  /** Khai báo trước ':itemId' để 'remove' không bị coi là id. */
  @Post('items/remove')
  @HttpCode(HttpStatus.OK)
  removeMany(@CurrentUser() user: AuthenticatedUser, @Body() dto: RemoveCartItemsDto) {
    return this.service.removeItems(user.id, dto.itemIds);
  }

  @Patch('items/:itemId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.service.setQuantity(user.id, itemId, dto.quantity);
  }

  @Delete('items/:itemId')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('itemId', ParseIntPipe) itemId: number) {
    return this.service.removeItem(user.id, itemId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clear(@CurrentUser() user: AuthenticatedUser) {
    return this.service.clear(user.id);
  }
}
