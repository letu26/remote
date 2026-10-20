import { describe, expect, it } from 'vitest';
import { maskReviewerName } from './reviewer-name.util.js';

describe('maskReviewerName', () => {
  it('giữ từ đầu, các từ sau lấy chữ cái đầu', () => {
    expect(maskReviewerName('Trần Tiến Dũng')).toBe('Trần T. D.');
    expect(maskReviewerName('Nguyễn Thị Hồng Nhung')).toBe('Nguyễn T. H. N.');
  });

  it('tên một từ -> chữ cái đầu + ***', () => {
    expect(maskReviewerName('Dũng')).toBe('D***');
  });

  it('bỏ khoảng trắng thừa (cả đầu, cuối, giữa, tab)', () => {
    expect(maskReviewerName('  Trần   Tiến \t Dũng  ')).toBe('Trần T. D.');
    expect(maskReviewerName('   Dũng  ')).toBe('D***');
  });

  it('xử lý dấu tiếng Việt ở dạng tổ hợp (NFD) như dạng dựng sẵn', () => {
    const nfd = 'Trần Đặng Ưng'.normalize('NFD');
    expect(maskReviewerName(nfd)).toBe('Trần Đ. Ư.');
    expect(maskReviewerName('Ưng'.normalize('NFD'))).toBe('Ư***');
  });

  it('viết hoa chữ cái đầu của các từ sau, kể cả chữ thường và chữ có dấu', () => {
    expect(maskReviewerName('anh đào lê')).toBe('anh Đ. L.');
    expect(maskReviewerName('Lê ân')).toBe('Lê Â.');
  });

  it('ký tự ngoài BMP (emoji) không bị cắt đôi', () => {
    expect(maskReviewerName('😀smile')).toBe('😀***');
  });

  it('rỗng/null -> tên mặc định', () => {
    expect(maskReviewerName('')).toBe('Khách hàng');
    expect(maskReviewerName('   ')).toBe('Khách hàng');
    expect(maskReviewerName(null)).toBe('Khách hàng');
    expect(maskReviewerName(undefined)).toBe('Khách hàng');
  });
});
