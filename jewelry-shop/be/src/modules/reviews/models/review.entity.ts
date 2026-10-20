import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('reviews')
@Index(['userId', 'productId'], { unique: true })
@Index(['productId', 'isHidden', 'createdAt'])
export class Review extends BaseEntity {
  @Index()
  @Column({ unsigned: true })
  userId: number;

  @Index()
  @Column({ unsigned: true })
  productId: number;

  @Index({ unique: true })
  @Column({ unsigned: true })
  orderItemId: number;

  @Column({ type: 'tinyint', unsigned: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ default: false })
  isHidden: boolean;
}
