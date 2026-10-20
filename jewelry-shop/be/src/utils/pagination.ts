import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PageRequest {
  page: number;
  pageSize: number;
  offset: number;
}

/** Chuẩn hóa page/pageSize; pageSize vượt trần thì bị cắt về trần. */
export function resolvePage(query: PageQueryDto, defaultSize: number, maxSize: number): PageRequest {
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? defaultSize, maxSize);
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function toPage<T>(items: T[], total: number, request: PageRequest): Page<T> {
  return {
    items,
    page: request.page,
    pageSize: request.pageSize,
    total,
    totalPages: Math.ceil(total / request.pageSize),
  };
}
