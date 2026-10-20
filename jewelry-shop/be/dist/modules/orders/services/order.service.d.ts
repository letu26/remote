import { type Page } from '../../../utils/pagination.js';
import { AddressRepository } from '../../addresses/repositories/address.repository.js';
import type { CancelOrderDto, CreateOrderDto, OrderListQueryDto, PreviewOrderDto } from '../dtos/order.dtos.js';
import { IdempotencyRepository } from '../repositories/idempotency.repository.js';
import { OrderQueryRepository } from '../repositories/order-query.repository.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { OrderPricingService } from './order-pricing.service.js';
import { OrderViewService } from './order-view.service.js';
type OrderDetail = Awaited<ReturnType<OrderViewService['customerDetail']>>;
export declare class OrderService {
    private readonly pricing;
    private readonly orders;
    private readonly queries;
    private readonly addresses;
    private readonly idempotency;
    private readonly views;
    constructor(pricing: OrderPricingService, orders: OrderRepository, queries: OrderQueryRepository, addresses: AddressRepository, idempotency: IdempotencyRepository, views: OrderViewService);
    preview(userId: number, dto: PreviewOrderDto): Promise<{
        items: {
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
        }[];
        subtotal: number;
        shippingFee: number;
        total: number;
        issues: {
            available?: number | undefined;
            cartItemId: number;
            issue: import("../../cart/services/cart.service.js").CartIssue | null;
        }[];
    }>;
    create(userId: number, idempotencyKey: string, dto: CreateOrderDto): Promise<{
        order: OrderDetail;
        created: boolean;
    }>;
    list(userId: number, query: OrderListQueryDto): Promise<Page<unknown>>;
    detail(userId: number, code: string): Promise<OrderDetail>;
    cancel(userId: number, code: string, dto: CancelOrderDto): Promise<OrderDetail>;
    private placeOrder;
    private assertOrderable;
    private insufficientStock;
}
export {};
