import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('gemstones')
export class Gemstone extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 100 })
  name: string;

  @Column({ default: true })
  isActive: boolean;
}
