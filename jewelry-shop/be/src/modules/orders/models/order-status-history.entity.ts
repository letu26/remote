import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';
import { OrderStatus } from './order.enums.js';

@Entity('order_status_history')
export class OrderStatusHistory extends BaseEntity {
  @Index()
  @Column({ unsigned: true })
  orderId: number;

  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @Column({ type: 'int', unsigned: true, nullable: true })
  changedById: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string | null;
}
