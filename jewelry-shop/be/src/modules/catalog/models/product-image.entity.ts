import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

@Entity('product_images')
export class ProductImage extends BaseEntity {
  @Index()
  @Column({ unsigned: true })
  productId: number;

  @Column({ length: 500 })
  url: string;

  /** Mã ảnh trên nhà cung cấp lưu trữ (Cloudinary) để xóa ảnh; null với ảnh nhập tay. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  publicId: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: false })
  isPrimary: boolean;
}
