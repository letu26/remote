import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('articles')
export class Article extends BaseEntity {
  @Column({ length: 255 })
  title: string;

  @Index({ unique: true })
  @Column({ length: 280 })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnailPublicId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  summary: string | null;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ type: 'int', unsigned: true, nullable: true })
  authorId: number | null;

  @Index()
  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'datetime', nullable: true })
  publishedAt: Date | null;
}
