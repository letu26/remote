import { http } from "@/services/http";
import type { Paginated } from "@/types/catalog";
import type { CreateOrderInput, OrderDetail, OrderListItem, OrderPreview, OrderStatus } from "@/types/order";

export const orderService = {
  preview: (itemIds: number[], shippingMethodId?: number, signal?: AbortSignal) =>
    http.post<OrderPreview>("/orders/preview", { itemIds, shippingMethodId }, { signal }).then((r) => r.data),
  /** `idempotencyKey` tạo mới mỗi lần mở trang thanh toán và dùng lại khi đặt lại. */
  create: (input: CreateOrderInput, idempotencyKey: string) =>
    http
      .post<OrderDetail>("/orders", input, { headers: { "Idempotency-Key": idempotencyKey } })
      .then((r) => r.data),
  list: (params: { page?: number; pageSize?: number; status?: OrderStatus }, signal?: AbortSignal) =>
    http.get<Paginated<OrderListItem>>("/orders", { params, signal }).then((r) => r.data),
  get: (code: string, signal?: AbortSignal) =>
    http.get<OrderDetail>(`/orders/${encodeURIComponent(code)}`, { signal }).then((r) => r.data),
  cancel: (code: string, reason?: string) =>
    http.post<OrderDetail>(`/orders/${encodeURIComponent(code)}/cancel`, reason ? { reason } : {}).then((r) => r.data),
};
