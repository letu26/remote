import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('provinces')
export class Province extends BaseEntity {
  @Index({ unique: true })
  @Column({ unsigned: true })
  code: number;

  @Column({ length: 100 })
  name: string;
}
