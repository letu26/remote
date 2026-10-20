import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('promotions')
@Index(['productId', 'startsAt', 'endsAt'])
export class Promotion extends BaseEntity {
  @Column({ length: 150 })
  name: string;

  @Column({ unsigned: true })
  productId: number;

  @Column({ type: 'tinyint', unsigned: true })
  discountPercent: number;

  @Column({ type: 'datetime' })
  startsAt: Date;

  @Column({ type: 'datetime' })
  endsAt: Date;

  @Column({ default: true })
  isActive: boolean;
}
