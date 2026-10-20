import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../exceptions/business.exception.js';
import { ErrorCode } from '../exceptions/error-codes.js';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Bỏ dấu tiếng Việt, chữ thường, nối bằng '-'. Chừa chỗ cho hậu tố '-NN'. */
export function slugify(input: string, maxLength = 100): string {
  const base = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, Math.max(1, maxLength - 6))
    .replace(/-+$/g, '');
  return base || 'item';
}

export function pickFreeSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

interface SlugPersistOptions<T> {
  name: string;
  slug?: string;
  maxLength: number;
  /** Trả các slug đã có bắt đầu bằng prefix. */
  findTaken: (prefix: string) => Promise<string[]>;
  save: (slug: string) => Promise<T>;
  /** Lỗi ném ra từ save có phải trùng slug (duplicate key) không. */
  isSlugConflict: (error: unknown) => boolean;
}

/**
 * Lưu bản ghi có slug. Slug do client gửi mà trùng -> 409. Slug tự sinh: chọn slug còn trống
 * rồi lưu; nếu bị chen ngang (race) và trùng key thì tính lại, thử tối đa 5 lần.
 */
export async function persistWithSlug<T>(options: SlugPersistOptions<T>): Promise<T> {
  const conflict = () =>
    new BusinessException(ErrorCode.SLUG_ALREADY_EXISTS, 'Slug đã tồn tại, vui lòng chọn slug khác', HttpStatus.CONFLICT, undefined, [
      { field: 'slug', message: 'Slug đã tồn tại' },
    ]);

  if (options.slug) {
    try {
      return await options.save(options.slug);
    } catch (error) {
      throw options.isSlugConflict(error) ? conflict() : error;
    }
  }

  const base = slugify(options.name, options.maxLength);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = new Set(await options.findTaken(base));
    try {
      return await options.save(pickFreeSlug(base, taken));
    } catch (error) {
      if (!options.isSlugConflict(error)) throw error;
    }
  }
  throw conflict();
}
