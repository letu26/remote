import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';
import { decimalTransformer } from '../../../utils/decimal.transformer.js';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Index()
  @Column({ unsigned: true })
  orderId: number;

  @Index()
  @Column({ unsigned: true })
  variantId: number;

  @Column({ length: 200 })
  productName: string;

  @Column({ length: 50 })
  productCode: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 30, default: '' })
  size: string;

  @Column({ type: 'decimal', precision: 15, scale: 0, transformer: decimalTransformer })
  unitPrice: number;

  @Column({ type: 'int', unsigned: true })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 0, transformer: decimalTransformer })
  lineTotal: number;
}
