import { describe, expect, it, vi } from 'vitest';
import type { GeminiGateway } from '../../ai/services/gemini-gateway.service.js';
import type { CacheService } from '../../redis/services/cache.service.js';
import { parsePickedIds, RecommendationAiService } from './recommendation-ai.service.js';

const products = [1, 2, 3, 4, 5].map((id) => ({ id, name: `SP ${id}`, price: 1000, category: { name: 'Nhẫn' } }));
const signals = { viewed: new Map<number, number>(), cart: new Set<number>(), purchased: new Set<number>() };
const service = (answer: string | null, configured = true) =>
  new RecommendationAiService(
    { isConfigured: () => configured, generate: vi.fn().mockResolvedValue(answer) } as unknown as GeminiGateway,
    { get: vi.fn().mockResolvedValue(null), set: vi.fn() } as unknown as CacheService,
  );
const pick = async (s: RecommendationAiService) => (await s.pick([], products, signals, 4)).map((p) => p.id);

describe('RecommendationAiService', () => {
  it('theo thứ tự AI chọn, thiếu thì bù theo thuật toán, bỏ id lạ', async () => {
    expect(await pick(service('```json\n[5, 99, 3, 5]\n```'))).toEqual([5, 3, 1, 2]);
  });

  it('không có khóa hoặc AI lỗi thì dùng thứ tự thuật toán', async () => {
    expect(await pick(service('[5]', false))).toEqual([1, 2, 3, 4]);
    expect(await pick(service(null))).toEqual([1, 2, 3, 4]);
    expect(await pick(service('không biết'))).toEqual([1, 2, 3, 4]);
  });

  it('mảng hỏng không làm lỗi', () => {
    expect(parsePickedIds('abc [x]', new Set([1]))).toEqual([]);
  });
});
