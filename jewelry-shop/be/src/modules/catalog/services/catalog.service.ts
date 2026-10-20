import { Injectable } from '@nestjs/common';
import type { CategoryNode, CategoryRef, CollectionItem, NamedItem } from '../models/catalog.types.js';
import { CatalogCacheRepository } from '../repositories/catalog-cache.repository.js';
import { CatalogLookupRepository } from '../repositories/catalog-lookup.repository.js';

export type CategoryIndex = Map<number, { node: CategoryNode; path: CategoryRef[] }>;

/** Dữ liệu tra cứu công khai (cây danh mục, chất liệu, loại đá, bộ sưu tập), có cache Redis. */
@Injectable()
export class CatalogService {
  constructor(
    private readonly lookups: CatalogLookupRepository,
    private readonly cache: CatalogCacheRepository,
  ) {}

  async getCategoryTree(): Promise<CategoryNode[]> {
    const cached = await this.cache.get<CategoryNode[]>('categories');
    if (cached) return cached;

    const rows = await this.lookups.findActiveCategories();
    const childrenByParent = new Map<number | null, typeof rows>();
    for (const row of rows) {
      const siblings = childrenByParent.get(row.parentId) ?? [];
      siblings.push(row);
      childrenByParent.set(row.parentId, siblings);
    }
    // Chỉ đi từ gốc xuống nên danh mục ẩn kéo theo con của nó cũng ẩn.
    const build = (parentId: number | null): CategoryNode[] =>
      (childrenByParent.get(parentId) ?? []).map((row) => ({ ...row, children: build(row.id) }));
    const tree = build(null);

    await this.cache.set('categories', tree);
    return tree;
  }

  async getMaterials(): Promise<NamedItem[]> {
    const cached = await this.cache.get<NamedItem[]>('materials');
    if (cached) return cached;
    const items = await this.lookups.findActiveMaterials();
    await this.cache.set('materials', items);
    return items;
  }

  async getGemstones(): Promise<NamedItem[]> {
    const cached = await this.cache.get<NamedItem[]>('gemstones');
    if (cached) return cached;
    const items = await this.lookups.findActiveGemstones();
    await this.cache.set('gemstones', items);
    return items;
  }

  async getCollections(): Promise<CollectionItem[]> {
    const cached = await this.cache.get<CollectionItem[]>('collections');
    if (cached) return cached;
    const items = await this.lookups.findActiveCollections();
    await this.cache.set('collections', items);
    return items;
  }

  /** Id -> node cùng chuỗi tổ tiên (gốc -> chính nó) của mọi danh mục đang hiển thị. */
  flattenTree(tree: CategoryNode[]): CategoryIndex {
    const result: CategoryIndex = new Map();
    const walk = (nodes: CategoryNode[], parentPath: CategoryRef[]) => {
      for (const node of nodes) {
        const path = [...parentPath, { id: node.id, name: node.name, slug: node.slug }];
        result.set(node.id, { node, path });
        walk(node.children, path);
      }
    };
    walk(tree, []);
    return result;
  }

  /** Id của node và mọi hậu duệ. */
  collectIds(node: CategoryNode): number[] {
    return [node.id, ...node.children.flatMap((child) => this.collectIds(child))];
  }
}
