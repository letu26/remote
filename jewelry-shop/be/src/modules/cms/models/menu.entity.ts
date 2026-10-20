import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('menus')
export class Menu extends BaseEntity {
  @Column({ length: 100 })
  label: string;

  @Column({ length: 255 })
  url: string;

  @Index()
  @Column({ type: 'int', unsigned: true, nullable: true })
  parentId: number | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  /** Vị trí hiển thị: 'header' | 'footer'. */
  @Column({ type: 'enum', enum: ['header', 'footer'], default: 'header' })
  placement: 'header' | 'footer';

  @Column({ default: true })
  isActive: boolean;
}
