/** Phần thuần (không I/O): chấm điểm gợi ý sản phẩm từ lịch sử xem, giỏ hàng và đơn đã mua. */

export const VIEW_WEIGHT = 1;
export const MAX_COUNTED_VIEWS = 5;
export const CART_WEIGHT = 4;
export const PURCHASE_WEIGHT = 8;

export interface ProductTraits {
  id: number;
  price: number;
  categoryId: number;
  parentCategoryId: number | null;
  materialId: number | null;
  targetGroup: string;
  gemstoneIds: number[];
}

export interface Signals {
  viewed: ReadonlyMap<number, number>;
  cart: ReadonlySet<number>;
  purchased: ReadonlySet<number>;
}

/** Mức quan tâm của người dùng với từng sản phẩm: mua > thêm giỏ > xem (xem nhiều lần được cộng, có trần). */
export function interestWeights({ viewed, cart, purchased }: Signals): Map<number, number> {
  const weights = new Map<number, number>();
  const add = (id: number, weight: number) => weights.set(id, (weights.get(id) ?? 0) + weight);
  for (const [id, count] of viewed) add(id, Math.min(count, MAX_COUNTED_VIEWS) * VIEW_WEIGHT);
  for (const id of cart) add(id, CART_WEIGHT);
  for (const id of purchased) add(id, PURCHASE_WEIGHT);
  return weights;
}

/** Độ giống nhau: cùng danh mục (hoặc cùng nhóm cha), chất liệu, đá, tầm giá ±30%, đối tượng. */
export function similarity(a: ProductTraits, b: ProductTraits): number {
  let score = 0;
  if (a.categoryId === b.categoryId) score += 3;
  else if (a.parentCategoryId !== null && a.parentCategoryId === b.parentCategoryId) score += 1;
  if (a.materialId !== null && a.materialId === b.materialId) score += 1;
  if (a.gemstoneIds.some((id) => b.gemstoneIds.includes(id))) score += 1.5;
  if (Math.abs(a.price - b.price) <= 0.3 * Math.max(a.price, b.price)) score += 1;
  if (a.targetGroup === b.targetGroup) score += 0.5;
  return score;
}

/** Id sản phẩm gợi ý, điểm cao trước. Không gợi ý lại thứ đã mua, đang trong giỏ hoặc đang xem. */
export function rankRecommendations(
  candidates: readonly ProductTraits[],
  interests: readonly ProductTraits[],
  signals: Signals,
  excludeProductId: number | undefined,
  limit: number,
): number[] {
  const weights = interestWeights(signals);
  return candidates
    .filter((c) => c.id !== excludeProductId && !signals.cart.has(c.id) && !signals.purchased.has(c.id))
    .map((c) => ({
      id: c.id,
      score: interests.reduce((sum, i) => sum + (weights.get(i.id) ?? 0) * similarity(c, i), 0),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .slice(0, limit)
    .map((c) => c.id);
}
