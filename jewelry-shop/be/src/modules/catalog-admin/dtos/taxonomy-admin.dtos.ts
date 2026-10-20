import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { SLUG_PATTERN } from '../../../utils/slug.util.js';
import { Trim } from '../../../utils/transforms.js';

const SLUG_MESSAGE = 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang';

export class CreateCategoryDto {
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @Trim()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Trim()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** Chất liệu và loại đá có cùng dạng. */
export class CreateNamedLookupDto {
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateNamedLookupDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCollectionDto {
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsOptional()
  @Trim()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MaxLength(170)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(500)
  bannerUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCollectionDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @Trim()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MaxLength(170)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(500)
  bannerUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
