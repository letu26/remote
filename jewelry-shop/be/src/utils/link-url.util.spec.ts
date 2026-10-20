import { describe, expect, it } from 'vitest';
import { isHttpsUrl, isSafeLink } from './link-url.util.js';

describe('isSafeLink', () => {
  it('chấp nhận đường dẫn nội bộ và http/https', () => {
    for (const ok of ['/', '/products?category=nhan', '/pages/ve-chung-toi', 'https://example.com/a', 'http://example.com']) {
      expect(isSafeLink(ok)).toBe(true);
    }
  });

  it('từ chối scheme nguy hiểm, //, ký tự điều khiển, khoảng trắng, rỗng', () => {
    for (const bad of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'data:text/html,<script>',
      'vbscript:x',
      '//evil.com',
      '/\\evil.com',
      '/ok\nHeader: x',
      '/a b',
      'ftp://example.com',
      'example.com',
      '',
      ' /x',
    ]) {
      expect(isSafeLink(bad)).toBe(false);
    }
    expect(isSafeLink(undefined)).toBe(false);
  });
});

describe('isHttpsUrl', () => {
  it('chỉ chấp nhận https', () => {
    expect(isHttpsUrl('https://res.cloudinary.com/x.png')).toBe(true);
    expect(isHttpsUrl('http://res.cloudinary.com/x.png')).toBe(false);
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpsUrl('/local.png')).toBe(false);
  });
});
