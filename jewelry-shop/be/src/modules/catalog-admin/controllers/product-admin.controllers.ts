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
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import {
  AdminProductListQueryDto,
  CreateProductDto,
  ReorderImagesDto,
  StockChangeDto,
  UpdateImageDto,
  UpdateProductDto,
} from '../dtos/product-admin.dtos.js';
import { ImageUploadInterceptor } from '../interceptors/image-upload.interceptor.js';
import { ProductAdminService } from '../services/product-admin.service.js';
import { ProductImageService, type UploadedImageFile } from '../services/product-image.service.js';

@Controller('admin/products')
@AdminOnly()
export class ProductAdminController {
  constructor(private readonly service: ProductAdminService) {}

  @Get()
  list(@Query() query: AdminProductListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getDetail(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/variants/:variantId/stock')
  changeStock(
    @Param('id', ParseIntPipe) id: number,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() dto: StockChangeDto,
  ) {
    return this.service.changeStock(id, variantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

@Controller('admin/products/:id/images')
@AdminOnly()
export class ProductImageAdminController {
  constructor(private readonly service: ProductImageService) {}

  @Post()
  @UseInterceptors(ImageUploadInterceptor)
  upload(@Param('id', ParseIntPipe) id: number, @UploadedFiles() files: UploadedImageFile[] | undefined) {
    return this.service.upload(id, files);
  }

  /** Khai báo trước ':imageId' để 'order' không bị coi là id. */
  @Put('order')
  reorder(@Param('id', ParseIntPipe) id: number, @Body() dto: ReorderImagesDto) {
    return this.service.reorder(id, dto.imageIds);
  }

  @Patch(':imageId')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body() dto: UpdateImageDto,
  ) {
    return this.service.update(id, imageId, dto);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Param('imageId', ParseIntPipe) imageId: number) {
    return this.service.remove(id, imageId);
  }
}
