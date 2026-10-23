import { afterEach, describe, expect, it, vi } from 'vitest';
import { domainEvents } from './domain-events.js';
import { PublishAfter } from './publish-after.decorator.js';

class Sample {
  name = 'sample';

  @PublishAfter('order.paid', (result: { ok: boolean }, [id]: number[]) => (result.ok ? { orderId: id as number } : null))
  async pay(id: number, ok: boolean): Promise<{ ok: boolean }> {
    if (id < 0) throw new Error('lỗi nghiệp vụ');
    return { ok: ok && this.name === 'sample' };
  }
}

const unsubscribers: (() => void)[] = [];
afterEach(() => unsubscribers.splice(0).forEach((off) => off()));
const listen = (handler: (p: { orderId: number }) => void | Promise<void>) => {
  unsubscribers.push(domainEvents.subscribe('order.paid', handler));
};
const flush = () => new Promise((resolve) => setTimeout(resolve, 15));

describe('@PublishAfter', () => {
  it('thành công -> trả kết quả như cũ và phát sự kiện với dữ liệu dựng từ kết quả và tham số', async () => {
    const handler = vi.fn();
    listen(handler);
    expect(await new Sample().pay(7, true)).toEqual({ ok: true });
    await flush();
    expect(handler).toHaveBeenCalledExactlyOnceWith({ orderId: 7 });
  });

  it('build trả null -> không phát', async () => {
    const handler = vi.fn();
    listen(handler);
    await new Sample().pay(7, false);
    await flush();
    expect(handler).not.toHaveBeenCalled();
  });

  it('phương thức ném lỗi -> lỗi được giữ nguyên và không phát', async () => {
    const handler = vi.fn();
    listen(handler);
    await expect(new Sample().pay(-1, true)).rejects.toThrow('lỗi nghiệp vụ');
    await flush();
    expect(handler).not.toHaveBeenCalled();
  });

  it('người nghe ném lỗi hoặc chạy chậm -> không ảnh hưởng nghiệp vụ', async () => {
    listen(async () => {
      throw new Error('gửi mail lỗi');
    });
    const slow = vi.fn();
    listen(() => new Promise<void>((resolve) => setTimeout(() => (slow(), resolve()), 30)));
    const started = Date.now();
    expect(await new Sample().pay(1, true)).toEqual({ ok: true });
    expect(Date.now() - started).toBeLessThan(25);
    await flush();
  });
});
