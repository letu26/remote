import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

export interface OrderPaidMailData {
  code: string;
  total: number;
  paymentLabel: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; quantity: number }[];
  adminUrl: string;
}

export interface OrderDeliveredMailData {
  code: string;
  total: number;
  items: { name: string; quantity: number }[];
  orderUrl: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  /** Gửi OTP bất đồng bộ (không await ở nơi gọi); lỗi chỉ ghi log, không log OTP. */
  sendOtpMail(to: string, fullName: string, otp: string, expiresMinutes: number): void {
    const html = buildOtpHtml(fullName, otp, expiresMinutes);
    const text = `Xin chào ${fullName},\n\nMã OTP đặt lại mật khẩu của bạn là: ${otp}\nMã có hiệu lực trong ${expiresMinutes} phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`;

    this.getTransporter()
      .sendMail({
        from: this.config.get<string>('MAIL_FROM') ?? this.config.get<string>('MAIL_USER'),
        to,
        subject: 'Mã OTP đặt lại mật khẩu',
        text,
        html,
      })
      .then(() => this.logger.log('OTP mail sent'))
      .catch((error: unknown) => this.logger.error(`Send OTP mail failed: ${(error as Error)?.message}`));
  }

  /** Báo cho từng admin biết có đơn vừa thanh toán xong cần phê duyệt. Gửi riêng từng người; lỗi chỉ ghi log. */
  sendOrderPaidMail(admins: { email: string; fullName: string }[], order: OrderPaidMailData): void {
    const subject = `Đơn ${order.code} đã thanh toán, cần phê duyệt`;
    const text = `Đơn hàng ${order.code} vừa được thanh toán ${order.paymentLabel} (${formatVnd(order.total)}).\n\nKhách hàng: ${order.customerName} - ${order.customerPhone}\nSản phẩm:\n${order.items.map((i) => `- ${i.name} x${i.quantity}`).join('\n')}\n\nMở đơn để phê duyệt: ${order.adminUrl}`;
    const from = this.config.get<string>('MAIL_FROM') ?? this.config.get<string>('MAIL_USER');
    for (const admin of admins) {
      this.getTransporter()
        .sendMail({ from, to: admin.email, subject, text, html: buildOrderPaidHtml(admin.fullName, order) })
        .then(() => this.logger.log(`Order paid mail sent (${order.code})`))
        .catch((error: unknown) => this.logger.error(`Send order paid mail failed: ${(error as Error)?.message}`));
    }
  }

  /** Báo khách đơn đã giao thành công. Lỗi chỉ ghi log. */
  sendOrderDeliveredMail(customer: { email: string; fullName: string }, order: OrderDeliveredMailData): void {
    const text = `Xin chào ${customer.fullName},\n\nĐơn hàng ${order.code} (${formatVnd(order.total)}) đã được giao thành công. Cảm ơn bạn đã mua sắm tại Lumière Gems.\n\nSản phẩm:\n${order.items.map((i) => `- ${i.name} x${i.quantity}`).join('\n')}\n\nXem đơn và đánh giá sản phẩm: ${order.orderUrl}`;
    this.getTransporter()
      .sendMail({
        from: this.config.get<string>('MAIL_FROM') ?? this.config.get<string>('MAIL_USER'),
        to: customer.email,
        subject: `Đơn ${order.code} đã giao thành công`,
        text,
        html: buildOrderDeliveredHtml(customer.fullName, order),
      })
      .then(() => this.logger.log(`Order delivered mail sent (${order.code})`))
      .catch((error: unknown) => this.logger.error(`Send order delivered mail failed: ${(error as Error)?.message}`));
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const port = Number(this.config.get<string>('MAIL_PORT') ?? 587);
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('MAIL_HOST'),
        port,
        secure: port === 465,
        auth: { user: this.config.get<string>('MAIL_USER'), pass: this.config.get<string>('MAIL_PASSWORD') },
      });
    }
    return this.transporter;
  }
}

/** Email OTP: bố cục bảng + CSS nội tuyến để hiển thị đúng trên Gmail, Outlook và điện thoại. */
function buildOtpHtml(fullName: string, otp: string, expiresMinutes: number): string {
  const digits = otp
    .split('')
    .map(
      (d) =>
        `<td style="padding:0 4px"><div style="width:44px;height:56px;line-height:56px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:700;color:#0b5f4e;background:#f1f7f6;border:1px solid #b4cfca;border-radius:10px">${escapeHtml(d)}</div></td>`,
    )
    .join('');
  return `<!doctype html>
<html lang="vi">
<body style="margin:0;padding:0;background:#eef5f3;font-family:Georgia,'Times New Roman',serif;color:#16302d">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Mã OTP của bạn: ${escapeHtml(otp)}. Có hiệu lực trong ${expiresMinutes} phút.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef5f3;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d9e8e5">
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#0f7a65,#2fb592);background-color:#0f7a65;padding:28px 24px">
            <div style="font-size:26px;line-height:1;color:#ffffff">&#9670;</div>
            <div style="margin-top:8px;font-size:22px;font-weight:700;letter-spacing:4px;color:#ffffff;text-transform:uppercase">Lumière Gems</div>
            <div style="margin-top:4px;font-size:12px;letter-spacing:2px;color:#dff3ee;text-transform:uppercase">Trang sức đá quý tinh tế</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 8px">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#16302d">Đặt lại mật khẩu</h1>
            <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#16302d">Xin chào <strong>${escapeHtml(fullName)}</strong>,</p>
            <p style="margin:0;font-size:15px;line-height:1.6;color:#55706c">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Hãy nhập mã xác nhận bên dưới để tiếp tục.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 32px 8px">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:12px 32px 4px">
            <span style="display:inline-block;padding:6px 14px;font-size:13px;color:#0b5f4e;background:#dff3ee;border-radius:999px">Có hiệu lực trong ${expiresMinutes} phút</span>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px">
            <div style="padding:14px 16px;font-size:13px;line-height:1.6;color:#55706c;background:#f7f4ea;border-left:3px solid #c9a24a;border-radius:6px">
              <strong style="color:#16302d">Lưu ý bảo mật:</strong> không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên Lumière Gems. Nếu bạn không yêu cầu, hãy bỏ qua email này, mật khẩu của bạn vẫn an toàn.
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:18px 24px;background:#f1f7f6;border-top:1px solid #d9e8e5;font-size:12px;line-height:1.6;color:#55706c">
            Email tự động, vui lòng không trả lời.<br />&copy; Lumière Gems. Bảo lưu mọi quyền.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const formatVnd = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;

/** Khung email dùng chung (bảng + CSS nội tuyến để hiển thị đúng trên Gmail, Outlook, điện thoại). */
function emailShell(opts: { subtitle: string; preheader: string; body: string; footer: string }): string {
  return `<!doctype html>
<html lang="vi">
<body style="margin:0;padding:0;background:#eef5f3;font-family:Georgia,'Times New Roman',serif;color:#16302d">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef5f3;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d9e8e5">
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#0f7a65,#2fb592);background-color:#0f7a65;padding:26px 24px">
            <div style="font-size:22px;font-weight:700;letter-spacing:4px;color:#ffffff;text-transform:uppercase">Lumière Gems</div>
            <div style="margin-top:4px;font-size:12px;letter-spacing:2px;color:#dff3ee;text-transform:uppercase">${opts.subtitle}</div>
          </td>
        </tr>
        ${opts.body}
        <tr>
          <td align="center" style="padding:16px 24px;background:#f1f7f6;border-top:1px solid #d9e8e5;font-size:12px;color:#55706c">${opts.footer}</td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemRows(items: { name: string; quantity: number }[]): string {
  const rows = items
    .slice(0, 8)
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e6f1ef;font-size:14px;color:#16302d">${escapeHtml(i.name)}</td><td align="right" style="padding:8px 0 8px 12px;border-bottom:1px solid #e6f1ef;font-size:14px;color:#55706c;white-space:nowrap">x${i.quantity}</td></tr>`,
    )
    .join('');
  const more = items.length > 8 ? `<tr><td colspan="2" style="padding:8px 0;font-size:13px;color:#55706c">và ${items.length - 8} sản phẩm khác</td></tr>` : '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}${more}</table>`;
}

function button(url: string, label: string): string {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;background:#0f7a65;border-radius:12px;text-decoration:none">${label}</a>
            <p style="margin:12px 0 0;font-size:12px;color:#55706c">Hoặc mở: ${escapeHtml(url)}</p>`;
}

/** Email báo admin có đơn đã thanh toán, cần vào phê duyệt. */
function buildOrderPaidHtml(adminName: string, order: OrderPaidMailData): string {
  const body = `<tr>
          <td style="padding:28px 32px 4px">
            <span style="display:inline-block;padding:5px 12px;font-size:12px;font-weight:700;color:#0b5f4e;background:#dff3ee;border-radius:999px">ĐÃ THANH TOÁN</span>
            <h1 style="margin:12px 0 8px;font-size:22px;color:#16302d">Có đơn hàng cần phê duyệt</h1>
            <p style="margin:0;font-size:15px;line-height:1.6;color:#55706c">Xin chào <strong style="color:#16302d">${escapeHtml(adminName)}</strong>, khách vừa thanh toán xong đơn hàng bên dưới. Vui lòng vào xác nhận đơn để cửa hàng chuẩn bị hàng.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 4px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f7f6;border-radius:12px">
              <tr><td style="padding:14px 16px;font-size:13px;color:#55706c">Mã đơn<br /><strong style="font-size:16px;color:#16302d;font-family:'Courier New',monospace">${escapeHtml(order.code)}</strong></td>
                  <td align="right" style="padding:14px 16px;font-size:13px;color:#55706c">Tổng tiền<br /><strong style="font-size:18px;color:#0b5f4e">${formatVnd(order.total)}</strong></td></tr>
              <tr><td colspan="2" style="padding:0 16px 14px;font-size:13px;color:#55706c">Khách hàng: <strong style="color:#16302d">${escapeHtml(order.customerName)}</strong> &middot; ${escapeHtml(order.customerPhone)}<br />Thanh toán: ${escapeHtml(order.paymentLabel)}</td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:12px 32px 4px">${itemRows(order.items)}</td></tr>
        <tr><td align="center" style="padding:22px 32px 30px">${button(order.adminUrl, 'Xem và phê duyệt đơn')}</td></tr>`;
  return emailShell({
    subtitle: 'Thông báo cho quản trị viên',
    preheader: `Đơn ${escapeHtml(order.code)} đã thanh toán ${formatVnd(order.total)}, cần phê duyệt.`,
    body,
    footer: 'Email tự động từ hệ thống Lumière Gems.',
  });
}

/** Email báo khách đơn đã giao thành công (bước cuối của đơn hàng). */
function buildOrderDeliveredHtml(customerName: string, order: OrderDeliveredMailData): string {
  const body = `<tr>
          <td style="padding:28px 32px 4px">
            <span style="display:inline-block;padding:5px 12px;font-size:12px;font-weight:700;color:#0b5f4e;background:#dff3ee;border-radius:999px">GIAO HÀNG THÀNH CÔNG</span>
            <h1 style="margin:12px 0 8px;font-size:22px;color:#16302d">Đơn hàng của bạn đã được giao</h1>
            <p style="margin:0;font-size:15px;line-height:1.6;color:#55706c">Xin chào <strong style="color:#16302d">${escapeHtml(customerName)}</strong>, cảm ơn bạn đã mua sắm tại Lumière Gems. Đơn hàng dưới đây đã được giao thành công, chúc bạn luôn hài lòng với trang sức của mình.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 4px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f7f6;border-radius:12px">
              <tr><td style="padding:14px 16px;font-size:13px;color:#55706c">Mã đơn<br /><strong style="font-size:16px;color:#16302d;font-family:'Courier New',monospace">${escapeHtml(order.code)}</strong></td>
                  <td align="right" style="padding:14px 16px;font-size:13px;color:#55706c">Tổng tiền<br /><strong style="font-size:18px;color:#0b5f4e">${formatVnd(order.total)}</strong></td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:12px 32px 4px">${itemRows(order.items)}</td></tr>
        <tr>
          <td align="center" style="padding:22px 32px 30px">
            <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#55706c">Bạn hài lòng với sản phẩm? Hãy chia sẻ đánh giá để giúp những khách hàng khác nhé.</p>
            ${button(order.orderUrl, 'Xem đơn và đánh giá sản phẩm')}
          </td>
        </tr>`;
  return emailShell({
    subtitle: 'Trang sức đá quý tinh tế',
    preheader: `Đơn ${escapeHtml(order.code)} đã giao thành công. Cảm ơn bạn đã mua sắm tại Lumière Gems.`,
    body,
    footer: 'Email tự động, vui lòng không trả lời.<br />&copy; Lumière Gems. Bảo lưu mọi quyền.',
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}
