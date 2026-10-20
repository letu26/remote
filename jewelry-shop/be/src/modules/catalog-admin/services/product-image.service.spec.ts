import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { BusinessException } from '../../../exceptions/index.js';
import { ImageStorage, type StoredImage } from '../../media/services/image-storage.js';
import type { AddImagesResult, ProductImageRepository } from '../repositories/product-image.repository.js';
import { ProductImageService, type UploadedImageFile } from './product-image.service.js';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP')]);

const file = (buffer: Buffer, mimetype: string): UploadedImageFile => ({ buffer, mimetype, size: buffer.length });

class FakeStorage extends ImageStorage {
  uploaded: string[] = [];
  deleted: string[] = [];
  failOnCall: number | null = null;
  configured = true;
  private calls = 0;

  isConfigured() {
    return this.configured;
  }

  upload(_data: Buffer, folder: string): Promise<StoredImage> {
    this.calls += 1;
    if (this.failOnCall === this.calls) return Promise.reject(new Error('boom'));
    const publicId = `${folder}/img${this.calls}`;
    this.uploaded.push(publicId);
    return Promise.resolve({ url: `https://cdn.test/${publicId}.jpg`, publicId });
  }

  delete(publicId: string): Promise<void> {
    this.deleted.push(publicId);
    return Promise.resolve();
  }
}

function build(overrides: Partial<Record<keyof ProductImageRepository, unknown>> = {}) {
  const repo = {
    productExists: vi.fn().mockResolvedValue(true),
    countByProduct: vi.fn().mockResolvedValue(0),
    addAll: vi.fn((_id: number, items: { url: string; publicId: string }[]): Promise<AddImagesResult> =>
      Promise.resolve({
        ok: true,
        images: items.map((item, index) => ({ id: index + 1, ...item, isPrimary: index === 0, sortOrder: index })),
      }),
    ),
    ...overrides,
  };
  const storage = new FakeStorage();
  const config = { get: () => 'jewelry-shop' } as unknown as ConfigService;
  const service = new ProductImageService(repo as unknown as ProductImageRepository, storage, config);
  return { service, repo, storage };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('ProductImageService.upload', () => {
  it('tải ảnh hợp lệ lên thư mục theo sản phẩm và lưu url + publicId', async () => {
    const { service, storage, repo } = build();
    const result = await service.upload(7, [file(JPEG, 'image/jpeg'), file(PNG, 'image/png'), file(WEBP, 'image/webp')]);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ isPrimary: true });
    expect(storage.uploaded.every((id) => id.startsWith('jewelry-shop/products/7/'))).toBe(true);
    expect(repo.addAll).toHaveBeenCalledOnce();
  });

  it('từ chối nội dung không phải ảnh dù MIME khai báo là ảnh', async () => {
    const { service, storage } = build();
    await expect(service.upload(1, [file(Buffer.from('<html>'), 'image/png')])).rejects.toMatchObject({ code: 'INVALID_IMAGE' });
    expect(storage.uploaded).toHaveLength(0);
  });

  it('từ chối khi MIME không khớp chữ ký file', async () => {
    const { service } = build();
    await expect(service.upload(1, [file(PNG, 'image/jpeg')])).rejects.toMatchObject({ code: 'INVALID_IMAGE' });
  });

  it('từ chối khi vượt 10 ảnh mỗi sản phẩm', async () => {
    const { service } = build({ countByProduct: vi.fn().mockResolvedValue(9) });
    await expect(service.upload(1, [file(JPEG, 'image/jpeg'), file(JPEG, 'image/jpeg')])).rejects.toMatchObject({
      code: 'IMAGE_LIMIT_EXCEEDED',
    });
  });

  it('trả 503 UPLOAD_NOT_CONFIGURED khi chưa cấu hình', async () => {
    const { service, storage } = build();
    storage.configured = false;
    const error = await service.upload(1, [file(JPEG, 'image/jpeg')]).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BusinessException);
    expect(error).toMatchObject({ code: 'UPLOAD_NOT_CONFIGURED' });
    expect((error as BusinessException).getStatus()).toBe(503);
  });

  it('trả 502 UPLOAD_FAILED và xóa các ảnh đã lên nếu một ảnh lỗi', async () => {
    const { service, storage, repo } = build();
    storage.failOnCall = 2;
    const error = await service.upload(1, [file(JPEG, 'image/jpeg'), file(JPEG, 'image/jpeg')]).catch((e: unknown) => e);
    expect(error).toMatchObject({ code: 'UPLOAD_FAILED' });
    await flush();
    expect(storage.deleted).toEqual(storage.uploaded);
    expect(repo.addAll).not.toHaveBeenCalled();
  });

  it('ghi DB lỗi thì xóa ảnh vừa tải lên', async () => {
    const { service, storage } = build({ addAll: vi.fn().mockRejectedValue(new Error('db down')) });
    await expect(service.upload(1, [file(JPEG, 'image/jpeg')])).rejects.toThrow('db down');
    await flush();
    expect(storage.deleted).toEqual(storage.uploaded);
  });

  it('404 khi sản phẩm không tồn tại', async () => {
    const { service } = build({ productExists: vi.fn().mockResolvedValue(false) });
    await expect(service.upload(1, [file(JPEG, 'image/jpeg')])).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
