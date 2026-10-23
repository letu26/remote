import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface MailRecipient {
  email: string;
  fullName: string;
}

export interface OrderMailInfo {
  id: number;
  code: string;
  total: number;
  receiverName: string;
  receiverPhone: string;
  customer: MailRecipient | null;
  items: { name: string; quantity: number }[];
}

/** Chỉ đọc dữ liệu cần để dựng email thông báo. */
@Injectable()
export class NotificationRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Quản trị viên đang hoạt động (nhận email phê duyệt đơn). */
  findActiveAdmins(): Promise<MailRecipient[]> {
    return this.dataSource.query("SELECT email, fullName FROM users WHERE role = 'admin' AND status = 'active'");
  }

  async findOrderMailInfo(orderId: number): Promise<OrderMailInfo | null> {
    const orders: {
      id: number;
      code: string;
      total: string | number;
      receiverName: string;
      receiverPhone: string;
      email: string | null;
      fullName: string | null;
      status: string | null;
    }[] = await this.dataSource.query(
      `SELECT o.id, o.code, o.total, o.receiverName, o.receiverPhone, u.email, u.fullName, u.status
       FROM orders o LEFT JOIN users u ON u.id = o.userId WHERE o.id = ?`,
      [orderId],
    );
    const order = orders[0];
    if (!order) return null;
    const items: { productName: string; quantity: number }[] = await this.dataSource.query(
      'SELECT productName, quantity FROM order_items WHERE orderId = ? ORDER BY id',
      [orderId],
    );
    return {
      id: order.id,
      code: order.code,
      total: Number(order.total),
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      customer: order.email && order.status === 'active' ? { email: order.email, fullName: order.fullName ?? order.receiverName } : null,
      items: items.map((i) => ({ name: i.productName, quantity: i.quantity })),
    };
  }
}
