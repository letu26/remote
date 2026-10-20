import { OrderStatus } from '../models/order.enums.js';
export const NEXT_STATUS = {
    [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
    [OrderStatus.CONFIRMED]: OrderStatus.PREPARING,
    [OrderStatus.PREPARING]: OrderStatus.SHIPPING,
    [OrderStatus.SHIPPING]: OrderStatus.DELIVERED,
};
export const ADMIN_CANCELLABLE = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
];
export const CUSTOMER_CANCELLABLE = [OrderStatus.PENDING];
export function isValidAdminTransition(from, to) {
    if (to === OrderStatus.CANCELLED)
        return ADMIN_CANCELLABLE.includes(from);
    return NEXT_STATUS[from] === to;
}
//# sourceMappingURL=order-status.rules.js.map