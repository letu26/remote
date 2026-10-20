/** Tạo Idempotency-Key (UUID v4). Dùng `crypto.randomUUID` nếu có, không thì dựng từ getRandomValues. */
export function newIdempotencyKey(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Giữ một key cho một lần mở trang thanh toán: bấm đặt lại (lỗi mạng, REQUEST_IN_PROGRESS...) dùng lại
 * cùng key; chỉ `renew()` khi nội dung đơn đã đổi (ví dụ PRICE_CHANGED).
 */
export function createIdempotencyHolder(generate: () => string = newIdempotencyKey) {
  let key = generate();
  return {
    get: () => key,
    renew: () => {
      key = generate();
      return key;
    },
  };
}
