import { OrderStatus } from '../models/order.enums.js';

/** Bước kế tiếp hợp lệ duy nhất của luồng giao hàng. */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
  [OrderStatus.CONFIRMED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.SHIPPING,
  [OrderStatus.SHIPPING]: OrderStatus.DELIVERED,
};

/** Admin được hủy ở các trạng thái này. */
export const ADMIN_CANCELLABLE: readonly OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
];

/** Khách chỉ hủy khi đơn còn chờ xác nhận. */
export const CUSTOMER_CANCELLABLE: readonly OrderStatus[] = [OrderStatus.PENDING];

export function isValidAdminTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (to === OrderStatus.CANCELLED) return ADMIN_CANCELLABLE.includes(from);
  return NEXT_STATUS[from] === to;
}
