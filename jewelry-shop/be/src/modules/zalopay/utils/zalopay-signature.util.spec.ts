import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  buildAppTransId,
  createOrderMac,
  hmacSha256,
  queryOrderMac,
  verifyCallbackMac,
  vietnamDatePrefix,
} from './zalopay-signature.util.js';

describe('zalopay-signature', () => {
  const fields = {
    appId: '2554',
    appTransId: '261023_LG20261023-123456_1',
    appUser: 'user7',
    amount: 5832000,
    appTime: 1792800000000,
    embedData: '{}',
    item: '[]',
  };

  it('mac tạo đơn đúng thứ tự trường và key1 (theo tài liệu ZaloPay)', () => {
    const input = '2554|261023_LG20261023-123456_1|user7|5832000|1792800000000|{}|[]';
    expect(createOrderMac(fields, 'k1')).toBe(createHmac('sha256', 'k1').update(input).digest('hex'));
  });

  it('đổi bất kỳ trường nào thì mac đổi', () => {
    expect(createOrderMac({ ...fields, amount: 1 }, 'k1')).not.toBe(createOrderMac(fields, 'k1'));
    expect(createOrderMac(fields, 'k2')).not.toBe(createOrderMac(fields, 'k1'));
  });

  it('mac hỏi trạng thái = HMAC(key1, app_id|app_trans_id|key1)', () => {
    expect(queryOrderMac('2554', 'abc', 'k1')).toBe(hmacSha256('k1', '2554|abc|k1'));
  });

  it('verifyCallbackMac: đúng key2 thì hợp lệ, sai mac hoặc sai độ dài thì không', () => {
    const data = '{"app_trans_id":"x","amount":1}';
    const mac = hmacSha256('k2', data);
    expect(verifyCallbackMac(data, mac, 'k2')).toBe(true);
    expect(verifyCallbackMac(data, mac, 'khac')).toBe(false);
    expect(verifyCallbackMac(`${data} `, mac, 'k2')).toBe(false);
    expect(verifyCallbackMac(data, 'ngan', 'k2')).toBe(false);
  });

  it('app_trans_id dùng ngày giờ Việt Nam và không quá 40 ký tự', () => {
    // 23:30 UTC ngày 22/10/2026 là 06:30 ngày 23/10 giờ Việt Nam.
    const now = new Date('2026-10-22T23:30:00Z');
    expect(vietnamDatePrefix(now)).toBe('261023');
    const id = buildAppTransId('LG20261023-123456', 2, now);
    expect(id).toBe('261023_LG20261023-123456_2');
    expect(id.length).toBeLessThanOrEqual(40);
    expect(() => buildAppTransId('X'.repeat(40), 1, now)).toThrow();
  });
});
