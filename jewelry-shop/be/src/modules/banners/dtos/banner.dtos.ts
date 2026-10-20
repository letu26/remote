import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { IsHttpsUrl, IsSafeLink } from '../../../utils/link-url.util.js';
import { Trim } from '../../../utils/transforms.js';

export const BANNER_POSITIONS = ['home_hero', 'home_promo'] as const;
export type BannerPosition = (typeof BANNER_POSITIONS)[number];

export class BannerQueryDto {
  @IsOptional()
  @IsIn(BANNER_POSITIONS)
  position?: BannerPosition;
}

export class CreateBannerDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title: string;

  @IsString()
  @MaxLength(500)
  @IsHttpsUrl()
  imageUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  imagePublicId?: string | null;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  @IsSafeLink()
  linkUrl?: string | null;

  @IsIn(BANNER_POSITIONS)
  position: BannerPosition;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-100000)
  @Max(100000)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBannerDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsHttpsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  imagePublicId?: string | null;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  @IsSafeLink()
  linkUrl?: string | null;

  @IsOptional()
  @IsIn(BANNER_POSITIONS)
  position?: BannerPosition;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-100000)
  @Max(100000)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
