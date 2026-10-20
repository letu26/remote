import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastHost } from "@/components/ui/ToastHost";
import { ApiError } from "@/utils/errors";

const replace = vi.fn();
const push = vi.fn();
// Router ổn định giữa các lần render, giống next/navigation thật.
const router = { replace, push };
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => router }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
const forgotPassword = vi.fn();
const resetPassword = vi.fn();
vi.mock("@/services/auth.service", () => ({
  authService: {
    forgotPassword: (...a: unknown[]) => forgotPassword(...a),
    resetPassword: (...a: unknown[]) => resetPassword(...a),
  },
}));
const changePassword = vi.fn();
vi.mock("@/services/user.service", () => ({
  userService: { changePassword: (...a: unknown[]) => changePassword(...a) },
}));

import { ChangePasswordForm } from "@/components/user/ChangePasswordForm";
import { getResetEmail, getResetToken, setResetToken } from "@/store/reset-flow";
import { consumeFlash } from "@/utils/flash";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { ResetPasswordForm } from "./ResetPasswordForm";

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  [forgotPassword, resetPassword, changePassword, replace, push].forEach((m) => m.mockReset());
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(cleanup);

describe("ForgotPasswordForm", () => {
  it("email sai định dạng: báo lỗi, không gọi API", async () => {
    render(<><ForgotPasswordForm /><ToastHost /></>);
    type("Email", "abc");
    fireEvent.click(screen.getByRole("button", { name: /Gửi mã OTP/ }));
    expect(await screen.findByText(/không đúng định dạng/)).toBeInTheDocument();
    expect(forgotPassword).not.toHaveBeenCalled();
  });
  it("thành công: gọi API, lưu email (sessionStorage) và chuyển /verify-otp", async () => {
    forgotPassword.mockResolvedValue({ message: "ok", expiresInSeconds: 120, resendAfterSeconds: 60 });
    render(<><ForgotPasswordForm /><ToastHost /></>);
    type("Email", "  User@Example.COM ");
    fireEvent.click(screen.getByRole("button", { name: /Gửi mã OTP/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/verify-otp"));
    expect(forgotPassword).toHaveBeenCalledWith("user@example.com");
    expect(getResetEmail()).toBe("user@example.com");
    expect(sessionStorage.getItem("resetFlow.email")).toBe("user@example.com");
    expect(localStorage.getItem("resetFlow.email")).toBeNull();
  });
  it("OTP_RATE_LIMITED hiện retryAfterSeconds, không chuyển trang", async () => {
    forgotPassword.mockRejectedValue(new ApiError(429, "OTP_RATE_LIMITED", "chờ", [], 42));
    render(<><ForgotPasswordForm /><ToastHost /></>);
    type("Email", "a@b.co");
    fireEvent.click(screen.getByRole("button", { name: /Gửi mã OTP/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("42 giây");
    expect(push).not.toHaveBeenCalled();
  });
  it("nút disable khi đang gửi", async () => {
    forgotPassword.mockReturnValue(new Promise(() => {}));
    render(<><ForgotPasswordForm /><ToastHost /></>);
    type("Email", "a@b.co");
    fireEvent.click(screen.getByRole("button", { name: /Gửi mã OTP/ }));
    expect(await screen.findByRole("button", { name: /Đang gửi/ })).toBeDisabled();
  });
});

describe("ResetPasswordForm", () => {
  it("không có resetToken -> về /forgot-password", async () => {
    render(<><ResetPasswordForm /><ToastHost /></>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/forgot-password"));
    expect(screen.queryByLabelText("Mật khẩu mới")).toBeNull();
  });
  it("validate mật khẩu ngắn và confirm không khớp, không gọi API", async () => {
    setResetToken("tok");
    render(<><ResetPasswordForm /><ToastHost /></>);
    type("Mật khẩu mới", "123");
    type("Xác nhận mật khẩu mới", "456");
    fireEvent.click(screen.getByRole("button", { name: /Đặt lại mật khẩu/ }));
    expect(await screen.findByText(/tối thiểu 6/)).toBeInTheDocument();
    expect(screen.getByText(/không khớp/)).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalledWith("/forgot-password");
  });
  it("thành công: gọi API, xóa dữ liệu luồng, flash và về /login", async () => {
    setResetToken("tok");
    sessionStorage.setItem("resetFlow.email", "a@b.co");
    resetPassword.mockResolvedValue({ message: "ok" });
    render(<><ResetPasswordForm /><ToastHost /></>);
    type("Mật khẩu mới", "Newpass1");
    type("Xác nhận mật khẩu mới", "Newpass1");
    fireEvent.click(screen.getByRole("button", { name: /Đặt lại mật khẩu/ }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(resetPassword).toHaveBeenCalledWith("tok", "Newpass1", "Newpass1");
    expect(getResetToken()).toBeNull();
    expect(getResetEmail()).toBeNull();
    expect(consumeFlash()?.kind).toBe("success");
    expect(replace).not.toHaveBeenCalledWith("/forgot-password");
  });
  it("RESET_TOKEN_INVALID: xóa luồng và dẫn về /forgot-password", async () => {
    setResetToken("tok");
    resetPassword.mockRejectedValue(new ApiError(400, "RESET_TOKEN_INVALID", "hỏng"));
    render(<><ResetPasswordForm /><ToastHost /></>);
    type("Mật khẩu mới", "Newpass1");
    type("Xác nhận mật khẩu mới", "Newpass1");
    fireEvent.click(screen.getByRole("button", { name: /Đặt lại mật khẩu/ }));
    const link = await screen.findByRole("link", { name: /Quay lại quên mật khẩu/ });
    expect(link).toHaveAttribute("href", "/forgot-password");
    expect(getResetToken()).toBeNull();
  });
});

describe("ChangePasswordForm", () => {
  const fill = (cur = "Oldpass1", pw = "Newpass1", cf = pw) => {
    type("Mật khẩu hiện tại", cur);
    type("Mật khẩu mới", pw);
    type("Xác nhận mật khẩu mới", cf);
  };
  it("thành công: clearToken, setFlash, về /login", async () => {
    sessionStorage.setItem("accessToken", "tok");
    changePassword.mockResolvedValue({ message: "ok" });
    render(<><ChangePasswordForm /><ToastHost /></>);
    fill();
    fireEvent.click(screen.getByRole("button", { name: /Đổi mật khẩu/ }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(changePassword).toHaveBeenCalledWith({ currentPassword: "Oldpass1", newPassword: "Newpass1", confirmPassword: "Newpass1" });
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(consumeFlash()?.message).toMatch(/đăng nhập lại/);
  });
  it("validate client: confirm không khớp, không gọi API", async () => {
    render(<><ChangePasswordForm /><ToastHost /></>);
    fill("Oldpass1", "Newpass1", "Other123");
    fireEvent.click(screen.getByRole("button", { name: /Đổi mật khẩu/ }));
    expect(await screen.findByText(/không khớp/)).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });
  it("lỗi theo details[].field hiện đúng ô và không xóa token", async () => {
    sessionStorage.setItem("accessToken", "tok");
    changePassword.mockRejectedValue(
      new ApiError(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", [{ field: "currentPassword", message: "Mật khẩu hiện tại không đúng" }]),
    );
    render(<><ChangePasswordForm /><ToastHost /></>);
    fill();
    fireEvent.click(screen.getByRole("button", { name: /Đổi mật khẩu/ }));
    expect((await screen.findByText("Mật khẩu hiện tại không đúng")).id).toBe("currentPassword-error");
    expect(sessionStorage.getItem("accessToken")).toBe("tok");
    expect(replace).not.toHaveBeenCalled();
  });
});
