import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { type Page, resolvePage, toPage } from '../../../utils/pagination.js';
import { AddressRepository } from '../../addresses/repositories/address.repository.js';
import type { CancelOrderDto, CreateOrderDto, OrderListQueryDto, PreviewOrderDto } from '../dtos/order.dtos.js';
import { OrderStatus } from '../models/order.enums.js';
import { IdempotencyRepository } from '../repositories/idempotency.repository.js';
import { OrderQueryRepository } from '../repositories/order-query.repository.js';
import { CartChangedError, OrderRepository, StockShortageError } from '../repositories/order.repository.js';
import { OrderPricingService, type OrderPricing } from './order-pricing.service.js';
import { CUSTOMER_CANCELLABLE } from './order-status.rules.js';
import { OrderViewService } from './order-view.service.js';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const PREVIEW_ITEMS_PER_ORDER = 3;

type OrderDetail = Awaited<ReturnType<OrderViewService['customerDetail']>>;

@Injectable()
export class OrderService {
  constructor(
    private readonly pricing: OrderPricingService,
    private readonly orders: OrderRepository,
    private readonly queries: OrderQueryRepository,
    private readonly addresses: AddressRepository,
    private readonly idempotency: IdempotencyRepository,
    private readonly views: OrderViewService,
  ) {}

  async preview(userId: number, dto: PreviewOrderDto) {
    const priced = await this.pricing.compute(userId, dto.itemIds, dto.shippingMethodId, false);
    return {
      items: priced.lines.map((line) => ({
        cartItemId: line.cartItemId,
        variantId: line.variantId,
        productId: line.productId,
        productName: line.productName,
        productSlug: line.productSlug,
        productCode: line.productCode,
        size: line.size,
        imageUrl: line.imageUrl,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      })),
      subtotal: priced.subtotal,
      shippingFee: priced.shippingFee,
      total: priced.total,
      issues: priced.lines
        .filter((line) => line.issue !== null)
        .map((line) => ({
          cartItemId: line.cartItemId,
          issue: line.issue,
          ...(line.issue === 'INSUFFICIENT_STOCK' ? { available: line.stock } : {}),
        })),
    };
  }

  /** Đặt hàng có chống trùng bằng Idempotency-Key; trả { order, created } (created=false: trả lại đơn cũ). */
  async create(userId: number, idempotencyKey: string, dto: CreateOrderDto): Promise<{ order: OrderDetail; created: boolean }> {
    const state = await this.idempotency.begin(userId, idempotencyKey);
    if (state.kind === 'in_progress') {
      throw new BusinessException(
        ErrorCode.REQUEST_IN_PROGRESS,
        'Yêu cầu đặt hàng đang được xử lý, vui lòng đợi giây lát',
        HttpStatus.CONFLICT,
      );
    }
    if (state.kind === 'done') {
      const existing = await this.queries.findByCode(userId, state.orderCode);
      if (existing) return { order: await this.views.customerDetail(existing), created: false };
    }

    try {
      const code = await this.placeOrder(userId, dto);
      if (state.kind === 'acquired') await this.idempotency.complete(userId, idempotencyKey, code);
      const order = await this.queries.findByCode(userId, code);
      return { order: await this.views.customerDetail(order as NonNullable<typeof order>), created: true };
    } catch (error) {
      if (state.kind === 'acquired') await this.idempotency.release(userId, idempotencyKey);
      throw error;
    }
  }

  async list(userId: number, query: OrderListQueryDto): Promise<Page<unknown>> {
    const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const { rows, total } = await this.queries.findCustomerPage(userId, query.status, request.pageSize, request.offset);
    const previews = await this.queries.findItemPreviews(
      rows.map((row) => row.id),
      PREVIEW_ITEMS_PER_ORDER,
    );
    const items = rows.map((row) => ({
      code: row.code,
      createdAt: row.createdAt,
      status: row.status,
      paymentMethod: row.paymentMethod,
      paymentStatus: row.paymentStatus,
      total: row.total,
      itemCount: previews.get(row.id)?.itemCount ?? 0,
      items: previews.get(row.id)?.items ?? [],
    }));
    return toPage(items, total, request);
  }

  async detail(userId: number, code: string): Promise<OrderDetail> {
    const order = await this.queries.findByCode(userId, code);
    if (!order) throw this.views.notFound();
    return this.views.customerDetail(order);
  }

  /** Khách hủy: khóa dòng đơn, kiểm tra lại trạng thái, hoàn kho đúng một lần. */
  async cancel(userId: number, code: string, dto: CancelOrderDto): Promise<OrderDetail> {
    const outcome = await this.orders.withLockedOrder({ code, userId }, async (tx) => {
      if (!CUSTOMER_CANCELLABLE.includes(tx.order.status)) return 'not_cancellable' as const;
      const reason = dto.reason?.trim() || null;
      await tx.update({ status: OrderStatus.CANCELLED, cancelReason: reason });
      await tx.addHistory(OrderStatus.CANCELLED, userId, reason ? `Khách hủy đơn: ${reason}` : 'Khách hủy đơn');
      await tx.restockItems();
      return 'cancelled' as const;
    });
    if (outcome === null) throw this.views.notFound();
    if (outcome === 'not_cancellable') {
      throw new BusinessException(
        ErrorCode.ORDER_NOT_CANCELLABLE,
        'Đơn hàng không còn ở trạng thái cho phép hủy',
        HttpStatus.CONFLICT,
      );
    }
    return this.detail(userId, code);
  }

  private async placeOrder(userId: number, dto: CreateOrderDto): Promise<string> {
    const address = await this.addresses.findOne(userId, dto.addressId);
    if (!address) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy địa chỉ nhận hàng', HttpStatus.NOT_FOUND);

    const priced = await this.pricing.compute(userId, dto.itemIds, dto.shippingMethodId, true);
    this.assertOrderable(priced);
    if (priced.total !== dto.expectedTotal) {
      throw new BusinessException(
        ErrorCode.PRICE_CHANGED,
        'Giá hoặc tổng tiền đã thay đổi, vui lòng kiểm tra lại đơn hàng',
        HttpStatus.CONFLICT,
        { total: priced.total, subtotal: priced.subtotal, shippingFee: priced.shippingFee },
      );
    }

    try {
      const created = await this.orders.createOrder({
        userId,
        receiverName: address.receiverName,
        receiverPhone: address.receiverPhone,
        provinceName: address.provinceName,
        wardName: address.wardName,
        addressDetail: address.detail,
        note: dto.note || null,
        shippingMethodId: (priced.shippingMethod as NonNullable<typeof priced.shippingMethod>).id,
        shippingMethodName: (priced.shippingMethod as NonNullable<typeof priced.shippingMethod>).name,
        shippingFee: priced.shippingFee,
        subtotal: priced.subtotal,
        total: priced.total,
        paymentMethod: dto.paymentMethod,
        lines: priced.lines,
      });
      return created.code;
    } catch (error) {
      if (error instanceof StockShortageError) throw this.insufficientStock(error.shortages);
      if (error instanceof CartChangedError) {
        throw new BusinessException(
          ErrorCode.PRICE_CHANGED,
          'Giỏ hàng vừa thay đổi, vui lòng kiểm tra lại đơn hàng',
          HttpStatus.CONFLICT,
          { total: priced.total, subtotal: priced.subtotal, shippingFee: priced.shippingFee },
        );
      }
      throw error;
    }
  }

  /** Dòng ngừng bán -> ITEM_UNAVAILABLE; thiếu hàng -> INSUFFICIENT_STOCK kèm shortages. */
  private assertOrderable(priced: OrderPricing): void {
    if (priced.lines.some((line) => line.issue === 'UNAVAILABLE')) {
      throw new BusinessException(
        ErrorCode.ITEM_UNAVAILABLE,
        'Có sản phẩm đã ngừng bán, vui lòng bỏ khỏi giỏ hàng',
        HttpStatus.CONFLICT,
      );
    }
    const short = priced.lines.filter((line) => line.issue !== null);
    if (short.length) {
      throw this.insufficientStock(
        short.map((line) => ({
          variantId: line.variantId,
          productName: line.productName,
          size: line.size,
          available: line.stock,
          requested: line.quantity,
        })),
      );
    }
  }

  private insufficientStock(shortages: unknown[]): BusinessException {
    return new BusinessException(
      ErrorCode.INSUFFICIENT_STOCK,
      'Một số sản phẩm không đủ tồn kho, đơn hàng chưa được tạo',
      HttpStatus.CONFLICT,
      { shortages },
    );
  }
}
