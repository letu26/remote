import { createHmac, timingSafeEqual } from 'node:crypto';

/** HMAC-SHA256 dạng hex (thuật toán mặc định của ZaloPay). */
export function hmacSha256(key: string, data: string): string {
  return createHmac('sha256', key).update(data).digest('hex');
}

export interface CreateOrderMacFields {
  appId: string;
  appTransId: string;
  appUser: string;
  amount: number;
  appTime: number;
  embedData: string;
  item: string;
}

/** mac tạo đơn = HMAC(key1, app_id|app_trans_id|app_user|amount|app_time|embed_data|item). */
export function createOrderMac(fields: CreateOrderMacFields, key1: string): string {
  const input = [fields.appId, fields.appTransId, fields.appUser, fields.amount, fields.appTime, fields.embedData, fields.item].join('|');
  return hmacSha256(key1, input);
}

/** mac hỏi trạng thái = HMAC(key1, app_id|app_trans_id|key1). */
export function queryOrderMac(appId: string, appTransId: string, key1: string): string {
  return hmacSha256(key1, [appId, appTransId, key1].join('|'));
}

/** Xác thực callback: HMAC(key2, data) phải bằng mac ZaloPay gửi (so sánh thời gian cố định). */
export function verifyCallbackMac(data: string, mac: string, key2: string): boolean {
  const expected = Buffer.from(hmacSha256(key2, data), 'utf8');
  const received = Buffer.from(mac, 'utf8');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Ngày yymmdd theo giờ Việt Nam (GMT+7), phần đầu của app_trans_id. */
export function vietnamDatePrefix(now: Date): string {
  const vn = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const yy = String(vn.getUTCFullYear()).slice(2);
  const mm = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(vn.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/** app_trans_id = yymmdd_<mã đơn>_<lần thử>, tối đa 40 ký tự; mỗi lần tạo mã QR mới phải đổi "lần thử". */
export function buildAppTransId(orderCode: string, attempt: number, now: Date): string {
  const id = `${vietnamDatePrefix(now)}_${orderCode}_${attempt}`;
  if (id.length > 40) throw new Error('app_trans_id quá dài');
  return id;
}
