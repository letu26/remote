import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const notifyMock = vi.fn();
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => notifyMock(...a) }));

const assign = vi.fn();
function setLocation(pathname: string) {
  Object.defineProperty(window, "location", { configurable: true, value: { pathname, assign } });
}

async function load(status: number | null, body: unknown = {}) {
  vi.resetModules();
  const { http } = await import("./http");
  const seen: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    seen.push(config);
    if (status === null) return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    const response = { data: body, status, statusText: "", headers: {}, config };
    throw new AxiosError("fail", "ERR_BAD_REQUEST", config, null, response);
  };
  http.defaults.adapter = adapter;
  return { http, seen };
}

beforeEach(() => { notifyMock.mockClear(); sessionStorage.clear(); assign.mockClear(); setLocation("/user"); });

describe("http interceptor", () => {
  it("gắn Bearer token vào header", async () => {
    sessionStorage.setItem("accessToken", "tok123");
    const { http, seen } = await load(null);
    await http.get("/users/me");
    expect(seen[0].headers.get("Authorization")).toBe("Bearer tok123");
  });
  it("không gắn header khi chưa có token", async () => {
    const { http, seen } = await load(null);
    await http.get("/users/me");
    expect(seen[0].headers.get("Authorization")).toBeFalsy();
  });
  it("401 ngoài /auth/* xóa token và chuyển /login", async () => {
    sessionStorage.setItem("accessToken", "tok");
    const { http } = await load(401, { code: "TOKEN_EXPIRED", message: "x" });
    await expect(http.get("/users/me")).rejects.toMatchObject({ status: 401, code: "TOKEN_EXPIRED" });
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login");
  });
  it("401 khi đã ở /login thì không chuyển lại (không loop)", async () => {
    setLocation("/login");
    const { http } = await load(401, { code: "TOKEN_INVALID", message: "x" });
    await expect(http.get("/users/me")).rejects.toBeTruthy();
    expect(assign).not.toHaveBeenCalled();
  });
  it("nhiều 401 liên tiếp chỉ chuyển trang một lần", async () => {
    const { http } = await load(401, { code: "TOKEN_INVALID", message: "x" });
    await Promise.allSettled([http.get("/a"), http.get("/b"), http.get("/c")]);
    expect(assign).toHaveBeenCalledTimes(1);
  });
  it("401 của /auth/login không xóa token, không chuyển trang", async () => {
    sessionStorage.setItem("accessToken", "tok");
    const { http } = await load(401, { code: "INVALID_CREDENTIALS", message: "sai" });
    await expect(http.post("/auth/login", {})).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(sessionStorage.getItem("accessToken")).toBe("tok");
    expect(assign).not.toHaveBeenCalled();
  });
  it("403 FORBIDDEN chuyển /unauthorized", async () => {
    const { http } = await load(403, { code: "FORBIDDEN", message: "x" });
    await expect(http.get("/admin/ping")).rejects.toMatchObject({ status: 403 });
    expect(assign).toHaveBeenCalledWith("/unauthorized");
  });
  it("401 TOKEN_REVOKED xóa token, lưu thông báo, chuyển /login", async () => {
    sessionStorage.setItem("accessToken", "tok");
    const { http } = await load(401, { code: "TOKEN_REVOKED", message: "x" });
    await expect(http.get("/users/me")).rejects.toMatchObject({ code: "TOKEN_REVOKED" });
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login");
    expect(sessionStorage.getItem("flashMessage")).toContain("hết hiệu lực");
  });
  it("403 ACCOUNT_LOCKED xóa token, chuyển /login kèm thông báo", async () => {
    sessionStorage.setItem("accessToken", "tok");
    const { http } = await load(403, { code: "ACCOUNT_LOCKED", message: "x" });
    await expect(http.get("/users/me")).rejects.toMatchObject({ code: "ACCOUNT_LOCKED" });
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login");
    expect(sessionStorage.getItem("flashMessage")).toContain("khóa");
  });
  it("lỗi OTP của /auth/verify-otp không kích hoạt redirect, giữ retryAfterSeconds", async () => {
    sessionStorage.setItem("accessToken", "tok");
    const { http } = await load(429, { code: "OTP_RATE_LIMITED", message: "x", retryAfterSeconds: 30 });
    await expect(http.post("/auth/forgot-password", {})).rejects.toMatchObject({
      code: "OTP_RATE_LIMITED",
      retryAfterSeconds: 30,
    });
    expect(assign).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("accessToken")).toBe("tok");
  });
  it("OTP_INVALID giữ remainingAttempts, thiếu thì undefined", async () => {
    let r = await load(400, { code: "OTP_INVALID", message: "x", remainingAttempts: 3 });
    await expect(r.http.post("/auth/verify-otp", {})).rejects.toMatchObject({ remainingAttempts: 3 });
    r = await load(400, { code: "OTP_INVALID", message: "x" });
    await expect(r.http.post("/auth/verify-otp", {})).rejects.toMatchObject({ remainingAttempts: undefined });
  });
  it("nhiều 401 liên tiếp: một thông báo flash, không bắn toast trùng", async () => {
    const { http } = await load(401, { code: "TOKEN_REVOKED", message: "x" });
    await Promise.allSettled([http.get("/a"), http.get("/b"), http.get("/c")]);
    expect(assign).toHaveBeenCalledTimes(1);
    expect(notifyMock).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("flashMessage")!).message).toContain("hết hiệu lực");
  });
  it("lỗi mạng đi qua toast với một nội dung thống nhất", async () => {
    vi.resetModules();
    const { http } = await import("./http");
    http.defaults.adapter = async (config) => {
      throw new AxiosError("Network Error", "ERR_NETWORK", config);
    };
    await Promise.allSettled([http.get("/a"), http.get("/b")]);
    const msgs = new Set(notifyMock.mock.calls.map((c) => `${c[0]}:${c[1]}`));
    expect(msgs.size).toBe(1);
  });
  it("lỗi validate giữ details", async () => {
    const { http } = await load(400, { code: "VALIDATION_ERROR", message: "m", details: [{ field: "phone", message: "bad" }] });
    await expect(http.post("/auth/register", {})).rejects.toMatchObject({ details: [{ field: "phone", message: "bad" }] });
  });
});
