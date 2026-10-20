import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { computeSalePrice } from '../../catalog/services/product-catalog.service.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
import { MAX_LINE_QUANTITY } from '../dtos/cart.dtos.js';
import { type CartLineRow, type VariantState, CartRepository } from '../repositories/cart.repository.js';

export type CartIssue = 'UNAVAILABLE' | 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK';

export interface CartItemView {
  id: number;
  variantId: number;
  productId: number;
  productCode: string;
  productName: string;
  productSlug: string;
  size: string;
  imageUrl: string | null;
  price: number;
  salePrice: number | null;
  discountPercent: number | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  available: boolean;
  issue: CartIssue | null;
}

export interface CartView {
  items: CartItemView[];
  subtotal: number;
  itemCount: number;
  totalQuantity: number;
  hasIssues: boolean;
}

export function detectIssue(line: CartLineRow, categoryVisible: boolean): CartIssue | null {
  if (!line.variantActive || !line.productActive || !categoryVisible) return 'UNAVAILABLE';
  if (line.stock <= 0) return 'OUT_OF_STOCK';
  if (line.stock < line.quantity) return 'INSUFFICIENT_STOCK';
  return null;
}

@Injectable()
export class CartService {
  constructor(
    private readonly cart: CartRepository,
    private readonly catalog: CatalogService,
  ) {}

  /** Chỉ đọc: không tạo giỏ khi chưa có. */
  async getCart(userId: number): Promise<CartView> {
    const [lines, tree] = await Promise.all([this.cart.findLines(userId, new Date()), this.catalog.getCategoryTree()]);
    // Cùng điều kiện hiển thị với GET /products (danh mục ẩn kéo theo danh mục con).
    const visibleCategories = this.catalog.flattenTree(tree);
    const items = lines.map((line): CartItemView => {
      const salePrice = computeSalePrice(line.price, line.discountPercent);
      const unitPrice = salePrice ?? line.price;
      const issue = detectIssue(line, visibleCategories.has(line.categoryId));
      return {
        id: line.id,
        variantId: line.variantId,
        productId: line.productId,
        productCode: line.productCode,
        productName: line.productName,
        productSlug: line.productSlug,
        size: line.size,
        imageUrl: line.imageUrl,
        price: line.price,
        salePrice,
        discountPercent: line.discountPercent,
        unitPrice,
        quantity: line.quantity,
        lineTotal: unitPrice * line.quantity,
        stock: line.stock,
        available: issue === null,
        issue,
      };
    });
    return {
      items,
      subtotal: items.filter((item) => item.issue === null).reduce((sum, item) => sum + item.lineTotal, 0),
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      hasIssues: items.some((item) => item.issue !== null),
    };
  }

  summary(userId: number) {
    return this.cart.summary(userId);
  }

  async addItem(userId: number, variantId: number, quantity = 1): Promise<CartView> {
    const visible = this.catalog.flattenTree(await this.catalog.getCategoryTree());
    await this.cart.runInCart(userId, async (tx) => {
      const state = await tx.findVariantState(variantId);
      this.assertSellable(state, visible);
      const existing = await tx.findItemByVariant(variantId);
      const inCart = existing?.quantity ?? 0;
      const total = inCart + quantity;
      if (total > MAX_LINE_QUANTITY) throw this.limitExceeded(inCart);
      if (total > (state as VariantState).stock) throw this.insufficient((state as VariantState).stock, inCart);
      await tx.addQuantity(variantId, quantity, MAX_LINE_QUANTITY);
    });
    return this.getCart(userId);
  }

  async setQuantity(userId: number, itemId: number, quantity: number): Promise<CartView> {
    const visible = this.catalog.flattenTree(await this.catalog.getCategoryTree());
    await this.cart.runInCart(userId, async (tx) => {
      const item = await tx.findItemById(itemId);
      if (!item) throw this.itemNotFound();
      const state = await tx.findVariantState(item.variantId);
      this.assertSellable(state, visible);
      if (quantity > (state as VariantState).stock) throw this.insufficient((state as VariantState).stock, item.quantity);
      await tx.setQuantity(itemId, quantity);
    });
    return this.getCart(userId);
  }

  async removeItem(userId: number, itemId: number): Promise<CartView> {
    if ((await this.cart.removeItems(userId, [itemId])) === 0) throw this.itemNotFound();
    return this.getCart(userId);
  }

  async removeItems(userId: number, itemIds: number[]): Promise<CartView> {
    await this.cart.removeItems(userId, [...new Set(itemIds)]);
    return this.getCart(userId);
  }

  clear(userId: number): Promise<void> {
    return this.cart.clear(userId);
  }

  private assertSellable(state: VariantState | null, visibleCategories: ReadonlyMap<number, unknown>): void {
    if (!state) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy sản phẩm hoặc biến thể', HttpStatus.NOT_FOUND);
    if (!state.variantActive || !state.productActive || !visibleCategories.has(state.categoryId)) {
      throw new BusinessException(
        ErrorCode.ITEM_UNAVAILABLE,
        'Sản phẩm này đã ngừng bán, không thể thêm vào giỏ',
        HttpStatus.CONFLICT,
      );
    }
  }

  private limitExceeded(inCart: number): BusinessException {
    return new BusinessException(
      ErrorCode.QUANTITY_LIMIT_EXCEEDED,
      `Mỗi sản phẩm chỉ mua tối đa ${MAX_LINE_QUANTITY} cái (trong giỏ đang có ${inCart})`,
      HttpStatus.BAD_REQUEST,
    );
  }

  private insufficient(available: number, inCart: number): BusinessException {
    return new BusinessException(
      ErrorCode.INSUFFICIENT_STOCK,
      `Chỉ còn ${available} sản phẩm trong kho (trong giỏ đang có ${inCart})`,
      HttpStatus.CONFLICT,
      { available, inCart },
    );
  }

  private itemNotFound(): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy mục trong giỏ hàng', HttpStatus.NOT_FOUND);
  }
}
