import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('addresses')
export class Address extends BaseEntity {
  @Index()
  @Column({ unsigned: true })
  userId: number;

  @Column({ length: 100 })
  receiverName: string;

  @Column({ length: 20 })
  receiverPhone: string;

  @Column({ unsigned: true })
  provinceId: number;

  @Column({ unsigned: true })
  wardId: number;

  @Column({ length: 255 })
  detail: string;

  @Column({ default: false })
  isDefault: boolean;
}
