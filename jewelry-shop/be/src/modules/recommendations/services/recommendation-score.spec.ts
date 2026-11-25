import { describe, expect, it } from 'vitest';
import { interestWeights, rankRecommendations, type ProductTraits } from './recommendation-score.js';

const product = (id: number, over: Partial<ProductTraits> = {}): ProductTraits => ({
  id,
  price: 1_000_000,
  categoryId: 1,
  parentCategoryId: null,
  materialId: null,
  targetGroup: 'women',
  gemstoneIds: [],
  ...over,
});
const none = { viewed: new Map<number, number>(), cart: new Set<number>(), purchased: new Set<number>() };

describe('recommendation score', () => {
  it('mua nặng hơn thêm giỏ, thêm giỏ nặng hơn xem; lượt xem có trần', () => {
    const weights = interestWeights({ viewed: new Map([[1, 99]]), cart: new Set([2]), purchased: new Set([3]) });
    expect([weights.get(1), weights.get(2), weights.get(3)]).toEqual([5, 4, 8]);
  });

  it('ưu tiên sản phẩm giống thứ đã mua, bỏ thứ đã mua / trong giỏ / đang xem', () => {
    const bought = product(1, { categoryId: 10 });
    const viewed = product(2, { categoryId: 20 });
    const likeBought = product(3, { categoryId: 10 });
    const likeViewed = product(4, { categoryId: 20 });
    const signals = { viewed: new Map([[2, 2]]), cart: new Set<number>(), purchased: new Set([1]) };
    const all = [bought, viewed, likeBought, likeViewed];
    expect(rankRecommendations(all, [bought, viewed], signals, 2, 5)).toEqual([3, 4]);
  });

  it('không có tín hiệu thì không gợi ý', () => {
    expect(rankRecommendations([product(1)], [], none, undefined, 5)).toEqual([]);
  });
});
