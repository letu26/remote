import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';
import { decimalTransformer } from '../../../utils/decimal.transformer.js';

export enum TargetGroup {
  MEN = 'men',
  WOMEN = 'women',
  UNISEX = 'unisex',
  KIDS = 'kids',
}

@Entity('products')
@Index(['isActive', 'categoryId', 'price'])
export class Product extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 50 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 220 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ unsigned: true })
  categoryId: number;

  @Index()
  @Column({ type: 'int', unsigned: true, nullable: true })
  materialId: number | null;

  @Index()
  @Column({ type: 'int', unsigned: true, nullable: true })
  collectionId: number | null;

  @Column({ type: 'enum', enum: TargetGroup, default: TargetGroup.UNISEX })
  targetGroup: TargetGroup;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true, transformer: decimalTransformer })
  weight: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0, transformer: decimalTransformer })
  costPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 0, transformer: decimalTransformer })
  price: number;

  @Column({ type: 'text', nullable: true })
  warrantyInfo: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  certificate: string | null;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', unsigned: true, default: 0 })
  soldCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, transformer: decimalTransformer })
  avgRating: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  reviewCount: number;
}
