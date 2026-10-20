import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Định dạng/ý nghĩa ngày được kiểm tra ở service (resolveStatsRange) để trả đúng field và message. */
export class StatsRangeQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  from?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  to?: string;
}

export class RevenueQueryDto extends StatsRangeQueryDto {
  @IsOptional()
  @IsIn(['day', 'month', 'year'])
  granularity?: 'day' | 'month' | 'year';
}

export class TopQueryDto extends StatsRangeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class LowStockQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  threshold?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
