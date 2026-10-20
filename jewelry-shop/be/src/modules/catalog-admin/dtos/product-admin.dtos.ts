import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { SLUG_PATTERN } from '../../../utils/slug.util.js';
import { ToBoolean, Trim } from '../../../utils/transforms.js';
import { TargetGroup } from '../../catalog/models/product.entity.js';

const MAX_MONEY = 1_000_000_000_000;

const Money = (min: number) => applyDecorators(Type(() => Number), IsInt(), Min(min), Max(MAX_MONEY));
const OptionalText = (max: number) => applyDecorators(IsOptional(), IsString(), MaxLength(max));
const OptionalRef = () => applyDecorators(IsOptional(), Type(() => Number), IsInt(), Min(1));

export class ProductGemstoneInputDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gemstoneId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(99999)
  carat?: number | null;

  @OptionalText(50)
  color?: string | null;

  @OptionalText(50)
  clarity?: string | null;

  @OptionalText(50)
  cut?: string | null;
}

export class ProductVariantInputDto {
  /** Có id: cập nhật biến thể hiện có. Không có: tạo mới. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  sku: string;

  /** Sản phẩm không có size dùng chuỗi rỗng. */
  @Trim()
  @IsString()
  @MaxLength(30)
  size: string;

  /** Chỉ dùng khi tạo mới; tồn kho của biến thể có sẵn đổi qua endpoint riêng. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateProductDto {
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @Trim()
  @Matches(SLUG_PATTERN, { message: 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang' })
  @MaxLength(220)
  slug?: string;

  @OptionalText(20000)
  description?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;

  @OptionalRef()
  materialId?: number | null;

  @OptionalRef()
  collectionId?: number | null;

  @IsOptional()
  @IsEnum(TargetGroup)
  targetGroup?: TargetGroup;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(9_999_999)
  weight?: number | null;

  @IsOptional()
  @Money(0)
  costPrice?: number;

  @Money(1)
  price: number;

  @OptionalText(5000)
  warrantyInfo?: string | null;

  @OptionalText(255)
  certificate?: string | null;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ProductGemstoneInputDto)
  gemstones?: ProductGemstoneInputDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants: ProductVariantInputDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @Trim()
  @Matches(SLUG_PATTERN, { message: 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang' })
  @MaxLength(220)
  slug?: string;

  @OptionalText(20000)
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @OptionalRef()
  materialId?: number | null;

  @OptionalRef()
  collectionId?: number | null;

  @IsOptional()
  @IsEnum(TargetGroup)
  targetGroup?: TargetGroup;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(9_999_999)
  weight?: number | null;

  @IsOptional()
  @Money(0)
  costPrice?: number;

  @IsOptional()
  @Money(1)
  price?: number;

  @OptionalText(5000)
  warrantyInfo?: string | null;

  @OptionalText(255)
  certificate?: string | null;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Có mặt thì thay thế toàn bộ danh sách đá quý. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ProductGemstoneInputDto)
  gemstones?: ProductGemstoneInputDto[];

  /** Có mặt thì đồng bộ biến thể (xem hợp đồng). */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[];
}

export class AdminProductListQueryDto extends PageQueryDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive?: boolean;
}

export class StockChangeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-10_000_000)
  @Max(10_000_000)
  delta?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  set?: number;
}

export class ReorderImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(1, { each: true })
  imageIds: number[];
}

export class UpdateImageDto {
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  sortOrder?: number;
}
