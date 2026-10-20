import { Transform } from 'class-transformer';

export const Trim = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

export const TrimLowerCase = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));

/** Query string 'true'/'false' -> boolean (giá trị khác giữ nguyên để IsBoolean báo lỗi). */
export const ToBoolean = () =>
  Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  });
