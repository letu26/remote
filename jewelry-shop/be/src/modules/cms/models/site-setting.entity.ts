import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('site_settings')
export class SiteSetting extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'setting_key', length: 100 })
  key: string;

  @Column({ type: 'text' })
  value: string;
}
