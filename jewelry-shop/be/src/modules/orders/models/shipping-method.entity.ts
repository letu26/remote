import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';
import { decimalTransformer } from '../../../utils/decimal.transformer.js';

@Entity('shipping_methods')
export class ShippingMethod extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0, transformer: decimalTransformer })
  fee: number;

  @Column({ default: true })
  isActive: boolean;
}
