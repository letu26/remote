import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('carts')
export class Cart extends BaseEntity {
  @Index({ unique: true })
  @Column({ unsigned: true })
  userId: number;
}
