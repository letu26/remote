import { describe, expect, it } from 'vitest';
import { mentioned, parsePriceRange, redactPersonalData } from './product-intent.js';

describe('parsePriceRange', () => {
  it.each([
    ['nhẫn dưới 5 triệu', { maxPrice: 5_000_000 }],
    ['vòng trên 2tr', { minPrice: 2_000_000 }],
    ['từ 2 đến 5 triệu', { minPrice: 2_000_000, maxPrice: 5_000_000 }],
    ['khoảng 1,5 triệu', { minPrice: 1_050_000, maxPrice: 1_950_000 }],
    ['phụ kiện duoi 300k', { maxPrice: 300_000 }],
    ['nhẫn size 12 giá bao nhiêu', {}],
  ])('%s', (message, expected) => expect(parsePriceRange(message)).toEqual(expected));
});

describe('mentioned', () => {
  const items = [{ name: 'Nhẫn' }, { name: 'Dây chuyền' }];
  it('so có dấu khi câu có dấu', () => {
    expect(mentioned('tư vấn nhẫn cưới', items)).toEqual([items[0]]);
    expect(mentioned('khi nào tôi nhận hàng', items)).toEqual([]);
  });
  it('so không dấu khi câu không dấu', () => {
    expect(mentioned('mua day chuyen', items)).toEqual([items[1]]);
  });
});

describe('redactPersonalData', () => {
  it('che email và số điện thoại, giữ nguyên số tiền', () => {
    expect(redactPersonalData('sđt 0912 345 678, mail a.b@gmail.com, ngân sách 5000000')).toBe(
      'sđt [số điện thoại], mail [email], ngân sách 5000000',
    );
  });
});
