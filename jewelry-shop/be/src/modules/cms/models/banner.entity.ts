import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('banners')
export class Banner extends BaseEntity {
  @Column({ length: 150 })
  title: string;

  @Column({ length: 500 })
  imageUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkUrl: string | null;

  /** Mã ảnh trên Cloudinary để xóa ảnh cũ; null nếu ảnh nhập tay. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  imagePublicId: string | null;

  @Index()
  @Column({ length: 50, default: 'home' })
  position: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;
}
