import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { IsSafeLink } from '../../../utils/link-url.util.js';
import { Trim } from '../../../utils/transforms.js';

export const MENU_PLACEMENTS = ['header', 'footer'] as const;
export type MenuPlacement = (typeof MENU_PLACEMENTS)[number];

export class MenuQueryDto {
  @IsOptional()
  @IsIn(MENU_PLACEMENTS)
  placement?: MenuPlacement;
}

export class CreateMenuDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label: string;

  @Trim()
  @IsString()
  @MaxLength(255)
  @IsSafeLink()
  url: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number | null;

  @IsOptional()
  @IsIn(MENU_PLACEMENTS)
  placement?: MenuPlacement;

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

export class UpdateMenuDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(255)
  @IsSafeLink()
  url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number | null;

  @IsOptional()
  @IsIn(MENU_PLACEMENTS)
  placement?: MenuPlacement;

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
