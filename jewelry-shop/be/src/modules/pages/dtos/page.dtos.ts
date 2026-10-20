import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { SLUG_PATTERN } from '../../../utils/slug.util.js';
import { Trim } from '../../../utils/transforms.js';

const MAX_CONTENT = 100_000;
const SLUG_MESSAGE = 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang';
const StripNul = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.split(String.fromCharCode(0)).join('') : value));

export class CreatePageDto {
  @Trim()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MinLength(2)
  @MaxLength(120)
  slug: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @StripNul()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CONTENT)
  content: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePageDto {
  @IsOptional()
  @Trim()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MinLength(2)
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @StripNul()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CONTENT)
  content?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
