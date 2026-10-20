import { DataSource, type EntityManager } from 'typeorm';
import type { OrderStatus, PaymentStatus } from '../../orders/models/order.enums.js';
import type { UserRole, UserStatus } from '../../users/models/user.entity.js';
export interface CustomerRow {
    id: number;
    fullName: string;
    phone: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
}
export interface CustomerStats {
    orderCount: number;
    totalSpent: number;
    lastOrderAt: Date | null;
}
export interface CustomerFilter {
    q?: string;
    status?: UserStatus;
    role?: UserRole;
}
export interface CustomerCounts {
    addressCount: number;
    reviewCount: number;
    wishlistCount: number;
}
export interface RecentOrderRow {
    id: number;
    code: string;
    createdAt: Date;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    total: number;
    itemCount: number;
}
export interface RoleChangeTransaction {
    target: CustomerRow;
    activeAdminIds: number[];
    setRole(role: UserRole): Promise<void>;
    handle: EntityManager;
}
export declare class CustomerAdminRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findPage(filter: CustomerFilter, limit: number, offset: number): Promise<{
        rows: CustomerRow[];
        total: number;
    }>;
    findById(id: number): Promise<CustomerRow | null>;
    findStats(userIds: number[]): Promise<Map<number, CustomerStats>>;
    findCounts(userId: number): Promise<CustomerCounts>;
    findRecentOrders(userId: number, limit: number): Promise<RecentOrderRow[]>;
    updateStatus(id: number, status: UserStatus): Promise<void>;
    withRoleChange<T>(targetId: number, work: (tx: RoleChangeTransaction) => Promise<T>): Promise<T | null>;
}
