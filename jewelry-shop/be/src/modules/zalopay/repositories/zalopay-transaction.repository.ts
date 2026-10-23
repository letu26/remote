import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../orders/models/order.enums.js';
import { ZaloPayTransactionStatus } from '../models/zalopay-transaction.entity.js';

export interface PayableOrderRow {
  id: number;
  code: string;
  userId: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
}

export interface TransactionRow {
  id: number;
  orderId: number;
  appTransId: string;
  amount: number;
  status: ZaloPayTransactionStatus;
  orderUrl: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface NewTransactionInput {
  orderId: number;
  appTransId: string;
  amount: number;
  orderUrl: string;
  expiresAt: Date;
}

export interface SettleInfo {
  zpTransId: string | null;
  channel: number | null;
  callbackData: string | null;
}

export interface SettleResult {
  outcome: SettleOutcome;
  orderId: number | null;
}

export type SettleOutcome = 'settled' | 'already_paid' | 'not_found';

const TRANSACTION_COLUMNS = 'id, orderId, appTransId, amount, status, orderUrl, expiresAt, createdAt';

/** Chỉ truy vấn và ghi dữ liệu thanh toán ZaloPay; quy tắc nghiệp vụ nằm ở ZaloPayService. */
@Injectable()
export class ZaloPayTransactionRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findOrderOfUser(code: string, userId: number): Promise<PayableOrderRow | null> {
    const rows: PayableOrderRow[] = await this.dataSource.query(
      'SELECT id, code, userId, total, status, paymentMethod, paymentStatus FROM orders WHERE code = ? AND userId = ?',
      [code, userId],
    );
    return rows[0] ? { ...rows[0], total: Number(rows[0].total) } : null;
  }

  async findByAppTransId(appTransId: string): Promise<TransactionRow | null> {
    const rows: TransactionRow[] = await this.dataSource.query(
      `SELECT ${TRANSACTION_COLUMNS} FROM zalopay_transactions WHERE appTransId = ?`,
      [appTransId],
    );
    return rows[0] ? { ...rows[0], amount: Number(rows[0].amount) } : null;
  }

  async findLatestByOrderId(orderId: number): Promise<TransactionRow | null> {
    const rows: TransactionRow[] = await this.dataSource.query(
      `SELECT ${TRANSACTION_COLUMNS} FROM zalopay_transactions WHERE orderId = ? ORDER BY id DESC LIMIT 1`,
      [orderId],
    );
    return rows[0] ? { ...rows[0], amount: Number(rows[0].amount) } : null;
  }

  async countByOrderId(orderId: number): Promise<number> {
    const rows: { n: string | number }[] = await this.dataSource.query(
      'SELECT COUNT(*) AS n FROM zalopay_transactions WHERE orderId = ?',
      [orderId],
    );
    return Number(rows[0]?.n ?? 0);
  }

  async insert(input: NewTransactionInput): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO zalopay_transactions (orderId, appTransId, amount, status, orderUrl, expiresAt)
       VALUES (?, ?, ?, 'pending', ?, ?)`,
      [input.orderId, input.appTransId, input.amount, input.orderUrl, input.expiresAt],
    );
  }

  async markFailed(appTransId: string): Promise<void> {
    await this.dataSource.query(
      "UPDATE zalopay_transactions SET status = 'failed' WHERE appTransId = ? AND status = 'pending'",
      [appTransId],
    );
  }

  /**
   * Ghi nhận đã thanh toán trong một giao dịch DB: khóa dòng giao dịch rồi khóa dòng đơn.
   * Gọi lặp (callback trùng, vừa callback vừa hỏi trạng thái) chỉ cộng một lần: lần sau trả 'already_paid'.
   */
  settle(appTransId: string, info: SettleInfo, historyNote: string): Promise<SettleResult> {
    return this.dataSource.transaction(async (manager) => {
      const txRows: { id: number; orderId: number; status: ZaloPayTransactionStatus }[] = await manager.query(
        'SELECT id, orderId, status FROM zalopay_transactions WHERE appTransId = ? FOR UPDATE',
        [appTransId],
      );
      const tx = txRows[0];
      if (!tx) return { outcome: 'not_found', orderId: null };
      if (tx.status === ZaloPayTransactionStatus.PAID) return { outcome: 'already_paid', orderId: tx.orderId };

      await manager.query(
        `UPDATE zalopay_transactions SET status = 'paid', paidAt = NOW(), zpTransId = ?, channel = ?, callbackData = ? WHERE id = ?`,
        [info.zpTransId, info.channel, info.callbackData, tx.id],
      );
      const orderRows: { status: OrderStatus; paymentStatus: PaymentStatus }[] = await manager.query(
        'SELECT status, paymentStatus FROM orders WHERE id = ? FOR UPDATE',
        [tx.orderId],
      );
      const order = orderRows[0];
      if (!order) return { outcome: 'not_found', orderId: tx.orderId };
      if (order.paymentStatus !== PaymentStatus.PAID) {
        await manager.query("UPDATE orders SET paymentStatus = 'paid', paidAt = NOW() WHERE id = ?", [tx.orderId]);
        await manager.query(
          'INSERT INTO order_status_history (orderId, status, changedById, note) VALUES (?, ?, NULL, ?)',
          [tx.orderId, order.status, historyNote.slice(0, 255)],
        );
      }
      return { outcome: 'settled', orderId: tx.orderId };
    });
  }
}
