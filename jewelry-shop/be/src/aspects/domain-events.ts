import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';

/** Tên sự kiện nghiệp vụ và dữ liệu đi kèm. Thêm sự kiện mới ở đây rồi gắn @PublishAfter vào đúng nghiệp vụ. */
export interface DomainEventPayloads {
  /** Đơn vừa được ghi nhận đã thanh toán lần đầu (ZaloPay). */
  'order.paid': { orderId: number };
  /** Đơn vừa chuyển sang "Giao hàng thành công" (bước cuối). */
  'order.delivered': { orderId: number };
}

export type DomainEventName = keyof DomainEventPayloads;

/**
 * Kênh sự kiện nội bộ cho các việc phụ chạy sau nghiệp vụ chính (gửi email, ...).
 * Người nghe chạy bất đồng bộ và lỗi của họ bị bắt lại ghi log, nên không bao giờ ảnh hưởng nghiệp vụ gọi publish.
 */
class DomainEventBus {
  private readonly logger = new Logger('DomainEvents');
  private readonly emitter = new EventEmitter();

  subscribe<E extends DomainEventName>(event: E, handler: (payload: DomainEventPayloads[E]) => Promise<void> | void): () => void {
    const wrapped = (payload: DomainEventPayloads[E]) => {
      // Tách khỏi luồng gọi: handler chạy sau khi nghiệp vụ đã trả kết quả.
      setImmediate(() => {
        Promise.resolve()
          .then(() => handler(payload))
          .catch((error: unknown) => this.logger.error(`Handler of "${event}" failed: ${(error as Error)?.message}`));
      });
    };
    this.emitter.on(event, wrapped);
    return () => this.emitter.off(event, wrapped);
  }

  publish<E extends DomainEventName>(event: E, payload: DomainEventPayloads[E]): void {
    this.emitter.emit(event, payload);
  }
}

export const domainEvents = new DomainEventBus();
