import { OrderStatus } from '../models/order.enums.js';
export declare const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>>;
export declare const ADMIN_CANCELLABLE: readonly OrderStatus[];
export declare const CUSTOMER_CANCELLABLE: readonly OrderStatus[];
export declare function isValidAdminTransition(from: OrderStatus, to: OrderStatus): boolean;
