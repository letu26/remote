import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('faqs')
export class Faq extends BaseEntity {
  @Column({ length: 500 })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'text', nullable: true })
  keywords: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;
}
