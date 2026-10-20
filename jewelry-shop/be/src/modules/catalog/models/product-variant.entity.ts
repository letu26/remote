import { Column, Entity, Index, VersionColumn } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('product_variants')
@Index(['productId', 'size'], { unique: true })
export class ProductVariant extends BaseEntity {
  @Column({ unsigned: true })
  productId: number;

  @Index({ unique: true })
  @Column({ length: 60 })
  sku: string;

  @Column({ type: 'varchar', length: 30, default: '' })
  size: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @VersionColumn()
  version: number;
}
