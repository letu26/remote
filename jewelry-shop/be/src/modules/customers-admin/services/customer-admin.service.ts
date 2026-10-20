import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { type Page, resolvePage, toPage } from '../../../utils/pagination.js';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import { UserRole, UserStatus } from '../../users/models/user.entity.js';
import type { CustomerListQueryDto, UpdateCustomerRoleDto, UpdateCustomerStatusDto } from '../dtos/customer.dtos.js';
import { type CustomerRow, type CustomerStats, CustomerAdminRepository } from '../repositories/customer-admin.repository.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const RECENT_ORDERS = 10;
const EMPTY_STATS: CustomerStats = { orderCount: 0, totalSpent: 0, lastOrderAt: null };

@Injectable()
export class CustomerAdminService {
  private readonly logger = new Logger(CustomerAdminService.name);

  constructor(
    private readonly customers: CustomerAdminRepository,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  async list(query: CustomerListQueryDto): Promise<Page<unknown>> {
    const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const { rows, total } = await this.customers.findPage(
      { q: query.q || undefined, status: query.status, role: query.role },
      request.pageSize,
      request.offset,
    );
    const stats = await this.customers.findStats(rows.map((row) => row.id));
    return toPage(
      rows.map((row) => this.toItem(row, stats.get(row.id) ?? EMPTY_STATS)),
      total,
      request,
    );
  }

  async detail(id: number) {
    const customer = await this.getOrFail(id);
    const [stats, counts, recentOrders] = await Promise.all([
      this.customers.findStats([id]),
      this.customers.findCounts(id),
      this.customers.findRecentOrders(id, RECENT_ORDERS),
    ]);
    return { ...this.toItem(customer, stats.get(id) ?? EMPTY_STATS), ...counts, recentOrders };
  }

  async updateStatus(adminId: number, id: number, dto: UpdateCustomerStatusDto) {
    const customer = await this.getOrFail(id);
    if (dto.status === UserStatus.LOCKED) {
      if (id === adminId) {
        throw new BusinessException(ErrorCode.CANNOT_MODIFY_SELF, 'Bạn không thể tự khóa tài khoản của chính mình', HttpStatus.CONFLICT);
      }
      if (customer.role === UserRole.ADMIN) {
        throw new BusinessException(ErrorCode.CANNOT_LOCK_ADMIN, 'Không thể khóa tài khoản quản trị viên', HttpStatus.CONFLICT);
      }
    }
    if (customer.status !== dto.status) {
      await this.customers.updateStatus(id, dto.status);
      // Chỉ ghi id và hành động, không ghi dữ liệu cá nhân.
      this.logger.log(`admin ${adminId} đặt trạng thái tài khoản ${id}: ${customer.status} -> ${dto.status}`);
    }
    return this.detailItem(id);
  }

  async updateRole(adminId: number, id: number, dto: UpdateCustomerRoleDto) {
    if (id === adminId) {
      throw new BusinessException(ErrorCode.CANNOT_MODIFY_SELF, 'Bạn không thể tự đổi quyền của chính mình', HttpStatus.CONFLICT);
    }
    const outcome = await this.customers.withRoleChange(id, async (tx) => {
      if (tx.target.role === dto.role) return 'unchanged' as const;
      const isActiveAdmin = tx.activeAdminIds.includes(tx.target.id);
      if (dto.role === UserRole.USER && isActiveAdmin && tx.activeAdminIds.length <= 1) return 'last_admin' as const;
      await tx.setRole(dto.role);
      // Role nằm trong token: thu hồi mọi token cũ trong CÙNG transaction để quyền mới áp dụng ngay.
      await this.blacklist.revokeAllInTransaction(tx.handle, id);
      return 'changed' as const;
    });
    if (outcome === null) throw this.notFound();
    if (outcome === 'last_admin') {
      throw new BusinessException(ErrorCode.LAST_ADMIN, 'Không thể hạ quyền quản trị viên cuối cùng của hệ thống', HttpStatus.CONFLICT);
    }
    if (outcome === 'changed') this.logger.log(`admin ${adminId} đổi quyền tài khoản ${id} thành ${dto.role}`);
    return this.detailItem(id);
  }

  private async detailItem(id: number) {
    const customer = await this.getOrFail(id);
    const stats = await this.customers.findStats([id]);
    return this.toItem(customer, stats.get(id) ?? EMPTY_STATS);
  }

  private toItem(customer: CustomerRow, stats: CustomerStats) {
    return {
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      role: customer.role,
      status: customer.status,
      createdAt: customer.createdAt,
      orderCount: stats.orderCount,
      totalSpent: stats.totalSpent,
      lastOrderAt: stats.lastOrderAt,
    };
  }

  private async getOrFail(id: number): Promise<CustomerRow> {
    const customer = await this.customers.findById(id);
    if (!customer) throw this.notFound();
    return customer;
  }

  private notFound(): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy khách hàng', HttpStatus.NOT_FOUND);
  }
}
