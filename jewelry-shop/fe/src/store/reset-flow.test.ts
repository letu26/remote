import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearResetFlow,
  getOtpTimers,
  getResetEmail,
  getResetToken,
  setOtpTimers,
  setResetEmail,
  setResetToken,
} from "./reset-flow";

beforeEach(() => sessionStorage.clear());

describe("reset-flow (sessionStorage)", () => {
  it("lưu và đọc email, resetToken", () => {
    expect(getResetEmail()).toBeNull();
    setResetEmail("a@b.co");
    setResetToken("tok");
    expect(getResetEmail()).toBe("a@b.co");
    expect(getResetToken()).toBe("tok");
  });
  it("không dùng localStorage", () => {
    setResetEmail("a@b.co");
    setResetToken("tok");
    expect(localStorage.length).toBe(0);
  });
  it("tính mốc hết hạn và gửi lại từ số giây", () => {
    const t = setOtpTimers(120, 60, 1_000_000);
    expect(t).toEqual({ otpExpiresAt: 1_120_000, resendAt: 1_060_000 });
    expect(getOtpTimers()).toEqual(t);
  });
  it("timers rỗng khi chưa có", () => {
    expect(getOtpTimers()).toEqual({ otpExpiresAt: null, resendAt: null });
  });
  it("clearResetFlow xóa sạch", () => {
    setResetEmail("a@b.co");
    setResetToken("tok");
    setOtpTimers(120, 60);
    clearResetFlow();
    expect(getResetEmail()).toBeNull();
    expect(getResetToken()).toBeNull();
    expect(getOtpTimers()).toEqual({ otpExpiresAt: null, resendAt: null });
  });
  it("không ném lỗi khi storage hỏng", () => {
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getResetEmail()).toBeNull();
    expect(() => setResetEmail("x@y.z")).not.toThrow();
    expect(() => clearResetFlow()).not.toThrow();
    get.mockRestore();
    set.mockRestore();
  });
});
