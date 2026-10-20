import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('cart_items')
@Index(['cartId', 'variantId'], { unique: true })
export class CartItem extends BaseEntity {
  @Column({ unsigned: true })
  cartId: number;

  @Index()
  @Column({ unsigned: true })
  variantId: number;

  @Column({ type: 'int', unsigned: true })
  quantity: number;
}
