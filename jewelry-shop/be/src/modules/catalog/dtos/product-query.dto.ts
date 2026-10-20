import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { ToBoolean, Trim } from '../../../utils/transforms.js';
import { TargetGroup } from '../models/product.entity.js';

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'bestseller', 'rating'] as const;

/** Query GET /products. */
export class ProductListQueryDto extends PageQueryDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(170)
  collection?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  material?: number;

  /** Nhiều id cách nhau dấu phẩy. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',').filter((part) => part.trim() !== '').map(Number) : value,
  )
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  @Min(1, { each: true })
  gemstone?: number[];

  @IsOptional()
  @IsEnum(TargetGroup)
  targetGroup?: TargetGroup;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000_000)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000_000)
  maxPrice?: number;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  onSale?: boolean;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort?: (typeof PRODUCT_SORTS)[number];
}
