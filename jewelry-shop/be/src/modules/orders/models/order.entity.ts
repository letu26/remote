import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';
import { decimalTransformer } from '../../../utils/decimal.transformer.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from './order.enums.js';

@Entity('orders')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Order extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 30 })
  code: string;

  @Column({ unsigned: true })
  userId: number;

  @Column({ length: 100 })
  receiverName: string;

  @Column({ length: 20 })
  receiverPhone: string;

  @Column({ length: 100 })
  provinceName: string;

  @Column({ length: 100 })
  wardName: string;

  @Column({ length: 255 })
  addressDetail: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ unsigned: true })
  shippingMethodId: number;

  /** Tên phương thức vận chuyển lúc đặt (snapshot). */
  @Column({ length: 100, default: '' })
  shippingMethodName: string;

  @Column({ type: 'decimal', precision: 15, scale: 0, transformer: decimalTransformer })
  subtotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0, transformer: decimalTransformer })
  shippingFee: number;

  @Column({ type: 'decimal', precision: 15, scale: 0, transformer: decimalTransformer })
  total: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelReason: string | null;
}
