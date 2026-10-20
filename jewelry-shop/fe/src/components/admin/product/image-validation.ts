export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_PRODUCT = 10;
/** Số file tối đa gửi trong một request tải ảnh. */
export const MAX_FILES_PER_REQUEST = 8;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ImageCheckResult {
  valid: File[];
  errors: string[];
}

/** Kiểm tra phía client (server vẫn kiểm tra lại MIME + magic bytes). */
export function checkImageFiles(files: File[], existingCount: number): ImageCheckResult {
  const valid: File[] = [];
  const errors: string[] = [];
  for (const f of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
      errors.push(`"${f.name}": chỉ nhận ảnh jpg, png hoặc webp`);
    } else if (f.size > MAX_IMAGE_BYTES) {
      errors.push(`"${f.name}": dung lượng vượt quá 5MB`);
    } else if (f.size === 0) {
      errors.push(`"${f.name}": tệp rỗng`);
    } else {
      valid.push(f);
    }
  }
  const room = Math.max(0, MAX_IMAGES_PER_PRODUCT - existingCount);
  if (valid.length > room) {
    errors.push(`Mỗi sản phẩm tối đa ${MAX_IMAGES_PER_PRODUCT} ảnh, còn nhận thêm được ${room} ảnh`);
    return { valid: valid.slice(0, room), errors };
  }
  return { valid, errors };
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Đổi chỗ phần tử index với index+delta (lên/xuống), trả mảng mới. */
export function moveItem<T>(items: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = items.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
