import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, type EntityManager } from 'typeorm';
import type { OrderStatus, PaymentStatus } from '../../orders/models/order.enums.js';
import type { UserRole, UserStatus } from '../../users/models/user.entity.js';

/** Dòng tài khoản đưa ra admin: TUYỆT ĐỐI không có passwordHash (không bao giờ SELECT cột này). */
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

/** Thao tác trên một tài khoản đổi quyền: đã khóa hàng của mọi admin đang hoạt động và của tài khoản đích. */
export interface RoleChangeTransaction {
  target: CustomerRow;
  /** Số admin đang hoạt động (đã khóa hàng) tại thời điểm này. */
  activeAdminIds: number[];
  setRole(role: UserRole): Promise<void>;
  /** Handle giao dịch để ghi thêm bảng khác (blacklist) trong CÙNG transaction. */
  handle: EntityManager;
}

const COLUMNS = 'id, fullName, phone, email, role, status, createdAt';
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class CustomerAdminRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findPage(filter: CustomerFilter, limit: number, offset: number): Promise<{ rows: CustomerRow[]; total: number }> {
    const conditions = ['1 = 1'];
    const params: unknown[] = [];
    if (filter.q) {
      const pattern = `%${escapeLike(filter.q)}%`;
      conditions.push('(fullName LIKE ? OR phone LIKE ? OR email LIKE ?)');
      params.push(pattern, pattern, pattern);
    }
    if (filter.status) {
      conditions.push('status = ?');
      params.push(filter.status);
    }
    if (filter.role) {
      conditions.push('role = ?');
      params.push(filter.role);
    }
    const where = conditions.join(' AND ');
    const [countRows, rows]: [{ total: string }[], CustomerRow[]] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM users WHERE ${where}`, params),
      this.dataSource.query(`SELECT ${COLUMNS} FROM users WHERE ${where} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`, [
        ...params,
        limit,
        offset,
      ]),
    ]);
    return { rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findById(id: number): Promise<CustomerRow | null> {
    const rows: CustomerRow[] = await this.dataSource.query(`SELECT ${COLUMNS} FROM users WHERE id = ?`, [id]);
    return rows[0] ?? null;
  }

  /** Chỉ số của cả trang bằng MỘT truy vấn gộp theo userId IN (...). */
  async findStats(userIds: number[]): Promise<Map<number, CustomerStats>> {
    const result = new Map<number, CustomerStats>();
    if (!userIds.length) return result;
    const rows: { userId: number; orderCount: string; totalSpent: string; lastOrderAt: Date | null }[] =
      await this.dataSource.query(
        `SELECT userId,
                SUM(status <> 'cancelled') AS orderCount,
                COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) AS totalSpent,
                MAX(createdAt) AS lastOrderAt
         FROM orders WHERE userId IN (?) GROUP BY userId`,
        [userIds],
      );
    for (const row of rows) {
      result.set(row.userId, {
        orderCount: Number(row.orderCount),
        totalSpent: Number(row.totalSpent),
        lastOrderAt: row.lastOrderAt,
      });
    }
    return result;
  }

  async findCounts(userId: number): Promise<CustomerCounts> {
    const rows: { addressCount: string; reviewCount: string; wishlistCount: string }[] = await this.dataSource.query(
      `SELECT (SELECT COUNT(*) FROM addresses WHERE userId = ?) AS addressCount,
              (SELECT COUNT(*) FROM reviews WHERE userId = ?) AS reviewCount,
              (SELECT COUNT(*) FROM wishlists WHERE userId = ?) AS wishlistCount`,
      [userId, userId, userId],
    );
    return {
      addressCount: Number(rows[0].addressCount),
      reviewCount: Number(rows[0].reviewCount),
      wishlistCount: Number(rows[0].wishlistCount),
    };
  }

  async findRecentOrders(userId: number, limit: number): Promise<RecentOrderRow[]> {
    const rows: (Omit<RecentOrderRow, 'total' | 'itemCount'> & { total: string; itemCount: string })[] =
      await this.dataSource.query(
        `SELECT o.id, o.code, o.createdAt, o.status, o.paymentStatus, o.total,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.orderId = o.id) AS itemCount
         FROM orders o WHERE o.userId = ? ORDER BY o.createdAt DESC, o.id DESC LIMIT ?`,
        [userId, limit],
      );
    return rows.map((row) => ({ ...row, total: Number(row.total), itemCount: Number(row.itemCount) }));
  }

  async updateStatus(id: number, status: UserStatus): Promise<void> {
    await this.dataSource.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  }

  /**
   * Đổi quyền trong MỘT transaction. Khóa hàng các admin đang hoạt động (theo id tăng dần) rồi mới khóa tài khoản đích
   * (thứ tự cố định để không deadlock): hai admin hạ quyền nhau song song bị tuần tự hóa và luôn thấy số admin thật.
   */
  async withRoleChange<T>(targetId: number, work: (tx: RoleChangeTransaction) => Promise<T>): Promise<T | null> {
    return this.dataSource.transaction(async (manager) => {
      const admins: { id: number }[] = await manager.query(
        "SELECT id FROM users WHERE role = 'admin' AND status = 'active' ORDER BY id ASC FOR UPDATE",
      );
      const targets: CustomerRow[] = await manager.query(`SELECT ${COLUMNS} FROM users WHERE id = ? FOR UPDATE`, [targetId]);
      if (!targets.length) return null;
      return work({
        target: targets[0],
        activeAdminIds: admins.map((row) => row.id),
        handle: manager,
        setRole: async (role) => {
          await manager.query('UPDATE users SET role = ? WHERE id = ?', [role, targetId]);
        },
      });
    });
  }
}
