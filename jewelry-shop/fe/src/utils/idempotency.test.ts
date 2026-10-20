import { describe, expect, it, vi } from "vitest";
import { createIdempotencyHolder, newIdempotencyKey } from "./idempotency";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("Idempotency-Key", () => {
  it("là UUID v4 và khác nhau mỗi lần", () => {
    const a = newIdempotencyKey();
    const b = newIdempotencyKey();
    expect(a).toMatch(UUID);
    expect(a).not.toBe(b);
  });
  it("có đường dự phòng khi không có crypto.randomUUID", () => {
    vi.stubGlobal("crypto", { getRandomValues: (a: Uint8Array) => a.fill(7) });
    expect(newIdempotencyKey()).toMatch(UUID);
    vi.unstubAllGlobals();
  });
  it("holder dùng lại cùng key cho tới khi renew", () => {
    let n = 0;
    const holder = createIdempotencyHolder(() => `key-${++n}`);
    expect(holder.get()).toBe("key-1");
    expect(holder.get()).toBe("key-1"); // bấm đặt lại: cùng key
    expect(holder.renew()).toBe("key-2"); // nội dung đơn đổi: key mới
    expect(holder.get()).toBe("key-2");
  });
  it("mỗi holder (mỗi lần mở trang) có key riêng", () => {
    expect(createIdempotencyHolder().get()).not.toBe(createIdempotencyHolder().get());
  });
});
