import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('wishlists')
@Index(['userId', 'productId'], { unique: true })
export class Wishlist extends BaseEntity {
  @Column({ unsigned: true })
  userId: number;

  @Index()
  @Column({ unsigned: true })
  productId: number;
}
