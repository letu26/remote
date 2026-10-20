import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { CartRepository } from '../../cart/repositories/cart.repository.js';
import { type CartIssue, detectIssue } from '../../cart/services/cart.service.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
import { computeSalePrice } from '../../catalog/services/product-catalog.service.js';
import { ShippingMethodRepository } from '../../shipping-methods/repositories/shipping-method.repository.js';

export interface PricedLine {
  cartItemId: number;
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  productCode: string;
  size: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  issue: CartIssue | null;
}

export interface OrderPricing {
  lines: PricedLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingMethod: { id: number; name: string } | null;
}

/**
 * Một nguồn duy nhất tính giá đơn hàng: dùng cho cả xem trước và đặt hàng thật.
 * Giá luôn lấy từ giá hiện tại (đã gồm khuyến mại), không bao giờ tin giá từ client.
 */
@Injectable()
export class OrderPricingService {
  constructor(
    private readonly cart: CartRepository,
    private readonly catalog: CatalogService,
    private readonly shippingMethods: ShippingMethodRepository,
  ) {}

  /**
   * @param requireShipping true khi đặt hàng thật (bắt buộc có phương thức hợp lệ);
   *  false khi xem trước (không chọn thì phí = 0).
   */
  async compute(userId: number, itemIds: number[], shippingMethodId: number | undefined, requireShipping: boolean): Promise<OrderPricing> {
    const wanted = new Set(itemIds);
    const [cartLines, tree, shipping] = await Promise.all([
      this.cart.findLines(userId, new Date()),
      this.catalog.getCategoryTree(),
      this.resolveShipping(shippingMethodId, requireShipping),
    ]);
    const visibleCategories = this.catalog.flattenTree(tree);

    const lines = cartLines
      .filter((line) => wanted.has(line.id))
      .map((line): PricedLine => {
        const unitPrice = computeSalePrice(line.price, line.discountPercent) ?? line.price;
        return {
          cartItemId: line.id,
          variantId: line.variantId,
          productId: line.productId,
          productName: line.productName,
          productSlug: line.productSlug,
          productCode: line.productCode,
          size: line.size,
          imageUrl: line.imageUrl,
          unitPrice,
          quantity: line.quantity,
          lineTotal: unitPrice * line.quantity,
          stock: line.stock,
          issue: detectIssue(line, visibleCategories.has(line.categoryId)),
        };
      });
    if (!lines.length) {
      throw new BusinessException(ErrorCode.EMPTY_ORDER, 'Chưa chọn sản phẩm hợp lệ nào trong giỏ hàng', HttpStatus.BAD_REQUEST);
    }

    const subtotal = lines.filter((line) => line.issue === null).reduce((sum, line) => sum + line.lineTotal, 0);
    const shippingFee = shipping?.fee ?? 0;
    return {
      lines,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      shippingMethod: shipping ? { id: shipping.id, name: shipping.name } : null,
    };
  }

  private async resolveShipping(id: number | undefined, required: boolean) {
    if (id === undefined) {
      if (required) throw this.shippingUnavailable();
      return null;
    }
    const method = await this.shippingMethods.findById(id);
    if (!method || !method.isActive) throw this.shippingUnavailable();
    return method;
  }

  private shippingUnavailable(): BusinessException {
    return new BusinessException(
      ErrorCode.SHIPPING_METHOD_UNAVAILABLE,
      'Phương thức vận chuyển không tồn tại hoặc đã tắt',
      HttpStatus.BAD_REQUEST,
    );
  }
}
