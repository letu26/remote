import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

export enum ZaloPayTransactionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

@Entity('zalopay_transactions')
export class ZaloPayTransaction extends BaseEntity {
  @Index()
  @Column({ unsigned: true })
  orderId: number;

  /** Mã giao dịch gửi ZaloPay (yymmdd_mãđơn_lần), duy nhất cho mỗi lần tạo mã QR. */
  @Index({ unique: true })
  @Column({ length: 40 })
  appTransId: string;

  @Column({ type: 'decimal', precision: 15, scale: 0, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  amount: number;

  @Column({ type: 'enum', enum: ZaloPayTransactionStatus, default: ZaloPayTransactionStatus.PENDING })
  status: ZaloPayTransactionStatus;

  @Column({ length: 1000 })
  orderUrl: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  zpTransId: string | null;

  @Column({ type: 'int', nullable: true })
  channel: number | null;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'text', nullable: true })
  callbackData: string | null;
}
