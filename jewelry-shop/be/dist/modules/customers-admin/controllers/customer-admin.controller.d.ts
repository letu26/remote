import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { CustomerListQueryDto, UpdateCustomerRoleDto, UpdateCustomerStatusDto } from '../dtos/customer.dtos.js';
import { CustomerAdminService } from '../services/customer-admin.service.js';
export declare class CustomerAdminController {
    private readonly service;
    constructor(service: CustomerAdminService);
    list(query: CustomerListQueryDto): Promise<import("../../../utils/pagination.js").Page<unknown>>;
    detail(id: number): Promise<{
        recentOrders: import("../repositories/customer-admin.repository.js").RecentOrderRow[];
        addressCount: number;
        reviewCount: number;
        wishlistCount: number;
        id: number;
        fullName: string;
        phone: string;
        email: string;
        role: import("../../users/models/user.entity.js").UserRole;
        status: import("../../users/models/user.entity.js").UserStatus;
        createdAt: Date;
        orderCount: number;
        totalSpent: number;
        lastOrderAt: Date | null;
    }>;
    updateStatus(admin: AuthenticatedUser, id: number, dto: UpdateCustomerStatusDto): Promise<{
        id: number;
        fullName: string;
        phone: string;
        email: string;
        role: import("../../users/models/user.entity.js").UserRole;
        status: import("../../users/models/user.entity.js").UserStatus;
        createdAt: Date;
        orderCount: number;
        totalSpent: number;
        lastOrderAt: Date | null;
    }>;
    updateRole(admin: AuthenticatedUser, id: number, dto: UpdateCustomerRoleDto): Promise<{
        id: number;
        fullName: string;
        phone: string;
        email: string;
        role: import("../../users/models/user.entity.js").UserRole;
        status: import("../../users/models/user.entity.js").UserStatus;
        createdAt: Date;
        orderCount: number;
        totalSpent: number;
        lastOrderAt: Date | null;
    }>;
}
