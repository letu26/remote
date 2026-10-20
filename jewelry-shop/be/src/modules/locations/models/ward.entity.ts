import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('wards')
export class Ward extends BaseEntity {
  @Index({ unique: true })
  @Column({ unsigned: true })
  code: number;

  @Column({ length: 100 })
  name: string;

  @Index()
  @Column({ unsigned: true })
  provinceId: number;
}
