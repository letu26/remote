import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

import { GuestGuard, RouteGuard } from "./RouteGuard";
import { AuthProvider } from "@/store/auth-context";

function makeToken(role: "admin" | "user", expOffsetSec: number) {
  const b = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  return `${b({ alg: "HS256" })}.${b({ sub: 1, id: 1, email: "a@b.co", role, iat: now, exp: now + expOffsetSec })}.sig`;
}
const wrap = (ui: React.ReactNode) => render(<AuthProvider>{ui}</AuthProvider>);

beforeEach(() => { sessionStorage.clear(); replace.mockClear(); });
afterEach(cleanup);

describe("RouteGuard", () => {
  it("chưa đăng nhập -> /login, không hiện nội dung", async () => {
    wrap(<RouteGuard><p>secret</p></RouteGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("secret")).toBeNull();
  });
  it("sai role -> /unauthorized", async () => {
    sessionStorage.setItem("accessToken", makeToken("user", 3600));
    wrap(<RouteGuard roles={["admin"]}><p>secret</p></RouteGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/unauthorized"));
    expect(screen.queryByText("secret")).toBeNull();
  });
  it("đúng role -> hiện nội dung, không chuyển trang", async () => {
    sessionStorage.setItem("accessToken", makeToken("admin", 3600));
    wrap(<RouteGuard roles={["admin"]}><p>secret</p></RouteGuard>);
    expect(await screen.findByText("secret")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
  it("token hết hạn -> bị xóa và về /login", async () => {
    sessionStorage.setItem("accessToken", makeToken("user", -60));
    wrap(<RouteGuard><p>secret</p></RouteGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(screen.queryByText("secret")).toBeNull();
  });
});

describe("redirect sau đăng nhập", () => {
  afterEach(() => window.history.pushState({}, "", "/"));
  it("RouteGuard: chưa đăng nhập ở /cart?x=1 -> /login?redirect=<đường dẫn>", async () => {
    window.history.pushState({}, "", "/cart?x=1");
    wrap(<RouteGuard><p>secret</p></RouteGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?redirect=%2Fcart%3Fx%3D1"));
  });
  it("GuestGuard: đã đăng nhập thì quay lại ?redirect= hợp lệ", async () => {
    sessionStorage.setItem("accessToken", makeToken("user", 3600));
    window.history.pushState({}, "", "/login?redirect=%2Fcart");
    wrap(<GuestGuard><p>form</p></GuestGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/cart"));
  });
  it.each(["//evil.com", "https://evil.com", "%2F%2Fevil.com", "javascript:alert(1)"])(
    "GuestGuard: redirect độc hại %s bị bỏ, về trang theo role",
    async (bad) => {
      sessionStorage.setItem("accessToken", makeToken("user", 3600));
      window.history.pushState({}, "", `/login?redirect=${bad}`);
      wrap(<GuestGuard><p>form</p></GuestGuard>);
      await waitFor(() => expect(replace).toHaveBeenCalledWith("/user"));
      expect(replace).not.toHaveBeenCalledWith(expect.stringContaining("evil"));
    },
  );
});

describe("GuestGuard", () => {
  it("khách thấy nội dung", async () => {
    wrap(<GuestGuard><p>form</p></GuestGuard>);
    expect(await screen.findByText("form")).toBeInTheDocument();
  });
  it.each([["admin", "/admin"], ["user", "/user"]] as const)("%s đã đăng nhập -> %s", async (role, path) => {
    sessionStorage.setItem("accessToken", makeToken(role, 3600));
    wrap(<GuestGuard><p>form</p></GuestGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(path));
    expect(screen.queryByText("form")).toBeNull();
  });
});
