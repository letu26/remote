import { domainEvents, type DomainEventName, type DomainEventPayloads } from './domain-events.js';

/**
 * Aspect (AOP): sau khi phương thức chạy THÀNH CÔNG thì phát sự kiện nghiệp vụ, để các việc phụ
 * (gửi email, ...) nằm ở nơi khác và nghiệp vụ không phải biết đến chúng.
 *
 * - `build` nhận kết quả và tham số của phương thức, trả về dữ liệu sự kiện, hoặc null nếu lần gọi này không cần phát
 *   (ví dụ callback trùng, hoặc chuyển trạng thái khác "giao thành công").
 * - Phương thức ném lỗi thì không phát gì.
 * - Dùng cho phương thức của service/provider (giữ nguyên tên và `this`), không dùng cho handler của controller.
 */
export function PublishAfter<E extends DomainEventName>(
  event: E,
  // `any`: kiểu kết quả và tham số phụ thuộc phương thức được gắn; nơi gọi tự khai báo kiểu cho tham số của `build`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build: (result: any, args: any[]) => DomainEventPayloads[E] | null,
) {
  return (_target: object, _key: string | symbol, descriptor: PropertyDescriptor): void => {
    const original = descriptor.value as ((...args: unknown[]) => unknown) | undefined;
    if (!original) return;
    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const result = await original.apply(this, args);
      const payload = build(result, args);
      if (payload !== null) domainEvents.publish(event, payload);
      return result;
    };
  };
}
