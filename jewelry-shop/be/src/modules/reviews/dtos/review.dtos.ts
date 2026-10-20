import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { ToBoolean, Trim } from '../../../utils/transforms.js';

export const MAX_COMMENT_LENGTH = 1000;

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(MAX_COMMENT_LENGTH)
  comment?: string | null;
}

export class UpdateReviewDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(MAX_COMMENT_LENGTH)
  comment?: string | null;
}

export class ReviewListQueryDto extends PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class AdminReviewListQueryDto extends PageQueryDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  hidden?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId?: number;
}

export class UpdateReviewVisibilityDto {
  @IsBoolean()
  isHidden: boolean;
}
