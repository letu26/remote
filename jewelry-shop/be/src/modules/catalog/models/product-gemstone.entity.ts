import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';
import { decimalTransformer } from '../../../utils/decimal.transformer.js';

@Entity('product_gemstones')
export class ProductGemstone extends BaseEntity {
  @Index()
  @Column({ unsigned: true })
  productId: number;

  @Index()
  @Column({ unsigned: true })
  gemstoneId: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true, transformer: decimalTransformer })
  carat: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  clarity: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cut: string | null;
}
