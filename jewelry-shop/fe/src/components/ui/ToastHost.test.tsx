import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { setFlash } from "@/utils/flash";
import { notify } from "@/utils/notify";
import { ToastHost } from "./ToastHost";

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  pathname = "/";
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const emit = (...a: Parameters<typeof notify>) => act(() => notify(...a));
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

describe("ToastHost", () => {
  it("hiện đúng loại và nội dung; error là alert, success là status", () => {
    render(<ToastHost />);
    emit("success", "Đã lưu");
    emit("error", "Lỗi rồi");
    emit("warning", "Cẩn thận");
    emit("info", "Thông tin");
    expect(screen.getByText("Đã lưu").closest("[data-kind]")).toHaveAttribute("data-kind", "success");
    const err = screen.getByText("Lỗi rồi").closest("[data-kind]")!;
    expect(err).toHaveAttribute("role", "alert");
    expect(err).toHaveAttribute("aria-live", "assertive");
    const ok = screen.getByText("Đã lưu").closest("[data-kind]")!;
    expect(ok).toHaveAttribute("role", "status");
    expect(ok).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Cẩn thận").closest("[data-kind]")).toHaveAttribute("data-kind", "warning");
    expect(screen.getByText("Thông tin").closest("[data-kind]")).toHaveAttribute("data-kind", "info");
  });
  it("tự đóng: success sau ~4s, error sau ~6s", async () => {
    render(<ToastHost />);
    emit("success", "ok");
    emit("error", "bad");
    await advance(4100);
    expect(screen.queryByText("ok")).toBeNull();
    expect(screen.getByText("bad")).toBeInTheDocument();
    await advance(2000);
    expect(screen.queryByText("bad")).toBeNull();
  });
  it("nút đóng và phím Escape đóng toast", () => {
    render(<ToastHost />);
    emit("info", "một");
    fireEvent.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    expect(screen.queryByText("một")).toBeNull();
    emit("info", "hai");
    fireEvent.keyDown(screen.getByRole("button", { name: "Đóng thông báo" }), { key: "Escape" });
    expect(screen.queryByText("hai")).toBeNull();
  });
  it("gộp thông báo trùng và đặt lại thời gian", async () => {
    render(<ToastHost />);
    emit("error", "trùng");
    await advance(4000);
    emit("error", "trùng");
    emit("error", "trùng");
    expect(screen.getAllByText("trùng")).toHaveLength(1);
    await advance(4000); // tổng 8s > 6s nhưng đã được làm mới
    expect(screen.getByText("trùng")).toBeInTheDocument();
    await advance(2500);
    expect(screen.queryByText("trùng")).toBeNull();
  });
  it("tối đa 4 toast", () => {
    render(<ToastHost />);
    for (let i = 1; i <= 6; i++) emit("info", `t${i}`);
    expect(screen.getAllByRole("status")).toHaveLength(4);
    expect(screen.queryByText("t1")).toBeNull();
    expect(screen.getByText("t6")).toBeInTheDocument();
  });
  it("tạm dừng khi rê chuột", async () => {
    render(<ToastHost />);
    emit("success", "giữ");
    const el = screen.getByText("giữ").closest("[data-kind]")!;
    fireEvent.mouseEnter(el);
    await advance(10_000);
    expect(screen.getByText("giữ")).toBeInTheDocument();
    fireEvent.mouseLeave(el);
    await advance(4100);
    expect(screen.queryByText("giữ")).toBeNull();
  });
  it("flash sau redirect hiện thành toast và chỉ một lần", () => {
    setFlash("success", "Đổi mật khẩu thành công");
    const { rerender } = render(<ToastHost />);
    expect(screen.getByText("Đổi mật khẩu thành công")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    pathname = "/login";
    rerender(<ToastHost />);
    expect(screen.queryByText("Đổi mật khẩu thành công")).toBeNull();
    expect(sessionStorage.getItem("flashMessage")).toBeNull();
  });
  it("flash đặt trước khi chuyển trang (SPA) cũng hiện ở trang đích", () => {
    const { rerender } = render(<ToastHost />);
    setFlash("error", "Tài khoản bị khóa");
    pathname = "/login";
    rerender(<ToastHost />);
    expect(screen.getByText("Tài khoản bị khóa")).toBeInTheDocument();
  });
});
