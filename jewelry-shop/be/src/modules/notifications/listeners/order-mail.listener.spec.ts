import { describe, expect, it, vi } from 'vitest';
import type { OrderMailInfo } from '../repositories/notification.repository.js';
import { OrderMailListener } from './order-mail.listener.js';

const info: OrderMailInfo = {
  id: 10,
  code: 'LG20261023-123456',
  total: 595_800,
  receiverName: 'Khách hàng thử',
  receiverPhone: '0900000002',
  customer: { email: 'khach@x.vn', fullName: 'Khách hàng thử' },
  items: [{ name: 'Bông tai', quantity: 1 }],
};

function build(overrides: { admins?: { email: string; fullName: string }[]; order?: OrderMailInfo | null } = {}) {
  const repository = {
    findActiveAdmins: vi.fn().mockResolvedValue(overrides.admins ?? [{ email: 'a@x.vn', fullName: 'A' }, { email: 'b@x.vn', fullName: 'B' }]),
    findOrderMailInfo: vi.fn().mockResolvedValue(overrides.order === undefined ? info : overrides.order),
  };
  const mail = { sendOrderPaidMail: vi.fn(), sendOrderDeliveredMail: vi.fn() };
  const config = { get: vi.fn().mockReturnValue('https://shop.example.vn/') };
  return { listener: new OrderMailListener(repository as never, mail as never, config as never), mail };
}

describe('OrderMailListener', () => {
  it('đơn đã thanh toán -> gửi tất cả admin, link phê duyệt đúng, không có "/" thừa', async () => {
    const { listener, mail } = build();
    await listener.onOrderPaid(10);
    const [admins, data] = mail.sendOrderPaidMail.mock.calls[0] as [{ email: string }[], { adminUrl: string; customerName: string; total: number }];
    expect(admins.map((a) => a.email)).toEqual(['a@x.vn', 'b@x.vn']);
    expect(data.adminUrl).toBe('https://shop.example.vn/admin/orders/10');
    expect(data.customerName).toBe('Khách hàng thử');
    expect(data.total).toBe(595_800);
  });

  it('không có admin nào đang hoạt động hoặc không thấy đơn -> không gửi', async () => {
    await expect(build({ admins: [] }).listener.onOrderPaid(10)).resolves.toBeUndefined();
    const noOrder = build({ order: null });
    await noOrder.listener.onOrderPaid(10);
    expect(noOrder.mail.sendOrderPaidMail).not.toHaveBeenCalled();
  });

  it('đơn đã giao -> gửi đúng email của khách kèm link xem đơn và đánh giá', async () => {
    const { listener, mail } = build();
    await listener.onOrderDelivered(10);
    const [customer, data] = mail.sendOrderDeliveredMail.mock.calls[0] as [{ email: string }, { orderUrl: string; code: string }];
    expect(customer.email).toBe('khach@x.vn');
    expect(data.orderUrl).toBe('https://shop.example.vn/user/orders/LG20261023-123456');
  });

  it('khách không có email hợp lệ (tài khoản bị khóa/đã xóa) -> bỏ qua, không lỗi', async () => {
    const { listener, mail } = build({ order: { ...info, customer: null } });
    await listener.onOrderDelivered(10);
    expect(mail.sendOrderDeliveredMail).not.toHaveBeenCalled();
  });
});
