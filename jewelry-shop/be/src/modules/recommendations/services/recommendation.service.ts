import { Injectable } from '@nestjs/common';
import { ProductQueryRepository } from '../../catalog/repositories/product-query.repository.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
import { ProductCatalogService } from '../../catalog/services/product-catalog.service.js';
import type { RecommendationDto } from '../dtos/recommendation.dtos.js';
import { RecommendationRepository } from '../repositories/recommendation.repository.js';
import { RecommendationAiService } from './recommendation-ai.service.js';
import { rankRecommendations } from './recommendation-score.js';

const LIMIT = 4;
/** Số sản phẩm thuật toán đề cử để AI chọn lại. */
const SHORTLIST = 12;

@Injectable()
export class RecommendationService {
  constructor(
    private readonly repository: RecommendationRepository,
    private readonly products: ProductQueryRepository,
    private readonly productCatalog: ProductCatalogService,
    private readonly catalog: CatalogService,
    private readonly ai: RecommendationAiService,
  ) {}

  /** `personalized: false` khi chưa có đủ tín hiệu; giao diện khi đó ẩn khối gợi ý. */
  async recommend(userId: number | null, dto: RecommendationDto) {
    const viewed = new Map((dto.viewed ?? []).map((item) => [item.productId, item.count]));
    const [cart, purchased] = userId
      ? await Promise.all([this.repository.findCartProductIds(userId), this.repository.findPurchasedProductIds(userId)])
      : [[], []];
    const interestIds = [...new Set([...viewed.keys(), ...cart, ...purchased])];
    if (!interestIds.length) return { personalized: false, items: [] };

    const { candidates, interests } = await this.repository.findTraits(interestIds);
    const signals = { viewed, cart: new Set(cart), purchased: new Set(purchased) };
    const ids = rankRecommendations(candidates, interests, signals, dto.excludeProductId, SHORTLIST);
    const now = new Date();
    const [shortlist, interested] = await Promise.all([
      this.products.findActiveByIds(ids, now),
      this.products.findActiveByIds(interestIds, now),
    ]);
    const categories = this.catalog.flattenTree(await this.catalog.getCategoryTree());
    const items = this.productCatalog.toItems(shortlist, categories);
    const picked = await this.ai.pick(this.productCatalog.toItems(interested, categories), items, signals, LIMIT);
    return { personalized: items.length > 0, items: picked };
  }
}
