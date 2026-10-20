import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('pages')
export class Page extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 120 })
  slug: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ default: true })
  isActive: boolean;
}
