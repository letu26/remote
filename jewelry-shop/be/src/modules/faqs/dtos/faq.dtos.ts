import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, registerDecorator } from 'class-validator';
import { Trim } from '../../../utils/transforms.js';

const MAX_KEYWORDS = 20;
const MAX_KEYWORD_LENGTH = 50;
const MIN_KEYWORD_LENGTH = 2;
const MAX_KEYWORDS_TOTAL = 1000;

/** Tách chuỗi từ khóa theo dấu phẩy, cắt khoảng trắng, bỏ phần rỗng. */
export function splitKeywords(raw: string): string[] {
  return raw
    .split(',')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

export function validateKeywords(raw: unknown): string | null {
  if (typeof raw !== 'string') return 'Từ khóa phải là chuỗi';
  if (raw.length > MAX_KEYWORDS_TOTAL) return `Tổng độ dài từ khóa tối đa ${MAX_KEYWORDS_TOTAL} ký tự`;
  const keywords = splitKeywords(raw);
  if (keywords.length > MAX_KEYWORDS) return `Tối đa ${MAX_KEYWORDS} từ khóa`;
  if (keywords.some((keyword) => keyword.length < MIN_KEYWORD_LENGTH || keyword.length > MAX_KEYWORD_LENGTH)) {
    return `Mỗi từ khóa dài ${MIN_KEYWORD_LENGTH}-${MAX_KEYWORD_LENGTH} ký tự`;
  }
  return null;
}

function IsKeywordList() {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isKeywordList',
      target: object.constructor,
      propertyName,
      validator: {
        validate: (value: unknown) => validateKeywords(value) === null,
        defaultMessage: (args) => validateKeywords(args?.value) ?? 'Từ khóa không hợp lệ',
      },
    });
}

export class CreateFaqDto {
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  answer: string;

  @IsOptional()
  @IsKeywordList()
  keywords?: string | null;

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

export class UpdateFaqDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  answer?: string;

  @IsOptional()
  @IsKeywordList()
  keywords?: string | null;

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
