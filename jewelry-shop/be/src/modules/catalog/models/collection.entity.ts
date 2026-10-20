import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('collections')
export class Collection extends BaseEntity {
  @Column({ length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 170 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bannerUrl: string | null;

  @Column({ default: true })
  isActive: boolean;
}
