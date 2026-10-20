import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { IsHttpsUrl } from '../../../utils/link-url.util.js';
import { PageQueryDto } from '../../../utils/pagination.js';
import { SLUG_PATTERN } from '../../../utils/slug.util.js';
import { ToBoolean, Trim } from '../../../utils/transforms.js';

const MAX_CONTENT = 100_000;

/** Markdown thuần: chỉ cắt ký tự NUL, không chuyển đổi gì khác. */
const StripNul = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.split(String.fromCharCode(0)).join('') : value));

export class ArticleListQueryDto extends PageQueryDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class AdminArticleListQueryDto extends ArticleListQueryDto {
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  published?: boolean;
}

export class CreateArticleDto {
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @Trim()
  @Matches(SLUG_PATTERN, { message: 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang' })
  @MaxLength(280)
  slug?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  summary?: string | null;

  @StripNul()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CONTENT)
  content: string;

  @IsOptional()
  // Chuỗi rỗng nghĩa là "không có/bỏ ảnh" nên bỏ qua kiểm tra https.
  @ValidateIf((_, value: unknown) => value !== '')
  @IsString()
  @MaxLength(500)
  @IsHttpsUrl()
  thumbnailUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  thumbnailPublicId?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateArticleDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @Trim()
  @Matches(SLUG_PATTERN, { message: 'slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang' })
  @MaxLength(280)
  slug?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  summary?: string | null;

  @IsOptional()
  @StripNul()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CONTENT)
  content?: string;

  @IsOptional()
  // Chuỗi rỗng nghĩa là "không có/bỏ ảnh" nên bỏ qua kiểm tra https.
  @ValidateIf((_, value: unknown) => value !== '')
  @IsString()
  @MaxLength(500)
  @IsHttpsUrl()
  thumbnailUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  thumbnailPublicId?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
