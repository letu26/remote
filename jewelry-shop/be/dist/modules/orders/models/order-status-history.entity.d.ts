import { BaseEntity } from '../../../models/base.entity.js';
import { OrderStatus } from './order.enums.js';
export declare class OrderStatusHistory extends BaseEntity {
    orderId: number;
    status: OrderStatus;
    changedById: number | null;
    note: string | null;
}
