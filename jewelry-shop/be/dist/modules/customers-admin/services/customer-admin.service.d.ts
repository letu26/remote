import { type Page } from '../../../utils/pagination.js';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import { UserRole, UserStatus } from '../../users/models/user.entity.js';
import type { CustomerListQueryDto, UpdateCustomerRoleDto, UpdateCustomerStatusDto } from '../dtos/customer.dtos.js';
import { CustomerAdminRepository } from '../repositories/customer-admin.repository.js';
export declare class CustomerAdminService {
    private readonly customers;
    private readonly blacklist;
    private readonly logger;
    constructor(customers: CustomerAdminRepository, blacklist: TokenBlacklistService);
    list(query: CustomerListQueryDto): Promise<Page<unknown>>;
    detail(id: number): Promise<{
        recentOrders: import("../repositories/customer-admin.repository.js").RecentOrderRow[];
        addressCount: number;
        reviewCount: number;
        wishlistCount: number;
        id: number;
        fullName: string;
        phone: string;
        email: string;
        role: UserRole;
        status: UserStatus;
        createdAt: Date;
        orderCount: number;
        totalSpent: number;
        lastOrderAt: Date | null;
    }>;
    updateStatus(adminId: number, id: number, dto: UpdateCustomerStatusDto): Promise<{
        id: number;
        fullName: string;
        phone: string;
        email: string;
        role: UserRole;
        status: UserStatus;
        createdAt: Date;
        orderCount: number;
        totalSpent: number;
        lastOrderAt: Date | null;
    }>;
    updateRole(adminId: number, id: number, dto: UpdateCustomerRoleDto): Promise<{
        id: number;
        fullName: string;
        phone: string;
        email: string;
        role: UserRole;
        status: UserStatus;
        createdAt: Date;
        orderCount: number;
        totalSpent: number;
        lastOrderAt: Date | null;
    }>;
    private detailItem;
    private toItem;
    private getOrFail;
    private notFound;
}
