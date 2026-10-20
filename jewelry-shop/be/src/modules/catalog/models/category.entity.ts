import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 120 })
  slug: string;

  @Index()
  @Column({ type: 'int', unsigned: true, nullable: true })
  parentId: number | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;
}
