import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { domainEvents } from '../../../aspects/domain-events.js';
import { MailService } from '../../mail/services/mail.service.js';
import { NotificationRepository } from '../repositories/notification.repository.js';

/**
 * Người nghe sự kiện đơn hàng và gửi email tương ứng (aspect @PublishAfter phát sự kiện, nghiệp vụ không biết đến email):
 * - order.paid: báo tất cả admin vào phê duyệt đơn.
 * - order.delivered: báo khách đơn đã giao thành công (bước cuối).
 */
@Injectable()
export class OrderMailListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderMailListener.name);
  private readonly unsubscribers: (() => void)[] = [];

  constructor(
    private readonly repository: NotificationRepository,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    this.unsubscribers.push(
      domainEvents.subscribe('order.paid', ({ orderId }) => this.onOrderPaid(orderId)),
      domainEvents.subscribe('order.delivered', ({ orderId }) => this.onOrderDelivered(orderId)),
    );
  }

  onModuleDestroy(): void {
    this.unsubscribers.splice(0).forEach((off) => off());
  }

  async onOrderPaid(orderId: number): Promise<void> {
    const [admins, order] = await Promise.all([this.repository.findActiveAdmins(), this.repository.findOrderMailInfo(orderId)]);
    if (!order || admins.length === 0) return;
    this.mail.sendOrderPaidMail(admins, {
      code: order.code,
      total: order.total,
      paymentLabel: 'qua ZaloPay',
      customerName: order.receiverName,
      customerPhone: order.receiverPhone,
      items: order.items,
      adminUrl: `${this.baseUrl()}/admin/orders/${order.id}`,
    });
  }

  async onOrderDelivered(orderId: number): Promise<void> {
    const order = await this.repository.findOrderMailInfo(orderId);
    if (!order) return;
    if (!order.customer) {
      this.logger.warn(`Đơn ${order.code}: khách không có email hợp lệ, bỏ qua email giao hàng`);
      return;
    }
    this.mail.sendOrderDeliveredMail(order.customer, {
      code: order.code,
      total: order.total,
      items: order.items,
      orderUrl: `${this.baseUrl()}/user/orders/${encodeURIComponent(order.code)}`,
    });
  }

  private baseUrl(): string {
    return (this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000').replace(/\/+$/, '');
  }
}
