import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Trim } from '../../../utils/transforms.js';

export class CreateShippingMethodDto {
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  fee: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateShippingMethodDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  fee?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
