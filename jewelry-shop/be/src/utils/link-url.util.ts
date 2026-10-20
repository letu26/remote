import { registerDecorator, type ValidationOptions } from 'class-validator';

/** Có ký tự điều khiển (mã 0-31 hoặc 127) không. */
export function hasControlCharacters(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

/** Liên kết an toàn: đường dẫn nội bộ ('/...' không phải '//...') hoặc http/https; không ký tự điều khiển/khoảng trắng. */
export function isSafeLink(value: unknown): boolean {
  if (typeof value !== 'string' || !value || hasControlCharacters(value) || /\s/.test(value)) return false;
  if (value.startsWith('/')) return !value.startsWith('//') && !value.includes('\\');
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname;
  } catch {
    return false;
  }
}

/** URL ảnh bắt buộc https. */
export function isHttpsUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value || hasControlCharacters(value) || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !!url.hostname;
  } catch {
    return false;
  }
}

function makeDecorator(name: string, check: (value: unknown) => boolean, defaultMessage: string) {
  return (options?: ValidationOptions) => (object: object, propertyName: string) =>
    registerDecorator({
      name,
      target: object.constructor,
      propertyName,
      options: { message: defaultMessage, ...options },
      validator: { validate: check },
    });
}

export const IsSafeLink = makeDecorator(
  'isSafeLink',
  isSafeLink,
  'Liên kết chỉ chấp nhận đường dẫn bắt đầu bằng / (không phải //) hoặc http/https',
);
export const IsHttpsUrl = makeDecorator('isHttpsUrl', isHttpsUrl, 'Địa chỉ phải là URL https');
