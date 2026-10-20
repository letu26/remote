import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastHost } from "@/components/ui/ToastHost";
import { ApiError } from "@/utils/errors";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ replace, push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
const register = vi.fn();
vi.mock("@/services/auth.service", () => ({
  authService: { register: (...a: unknown[]) => register(...a), login: vi.fn() },
}));
const login = vi.fn();
vi.mock("@/store/auth-context", () => ({ useAuth: () => ({ login }) }));

import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
function fillRegister(over: Record<string, string> = {}) {
  type("Họ và tên", over.fullName ?? "Nguyen Van A");
  type("Email", over.email ?? "a@b.co");
  type("Số điện thoại", over.phone ?? "0912345678");
  type("Mật khẩu", over.password ?? "123456");
  type("Xác nhận mật khẩu", over.confirmPassword ?? "123456");
  if (over.terms !== "no") fireEvent.click(screen.getByRole("checkbox"));
}
const submitBtn = (name: RegExp) => screen.getByRole("button", { name });

beforeEach(() => { register.mockReset(); login.mockReset(); replace.mockClear(); });
afterEach(cleanup);

describe("RegisterForm", () => {
  it("lỗi validate phía client, không gọi API", async () => {
    render(<><RegisterForm /><ToastHost /></>);
    fillRegister({ phone: "123", terms: "no", confirmPassword: "zzzzzz" });
    fireEvent.click(submitBtn(/Đăng ký/));
    expect(await screen.findByText(/10 số/)).toBeInTheDocument();
    expect(screen.getByText(/không khớp/)).toBeInTheDocument();
    expect(screen.getByText(/đồng ý với điều khoản/, { selector: "p" })).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });
  it("PHONE_ALREADY_EXISTS gắn vào ô số điện thoại", async () => {
    register.mockRejectedValue(new ApiError(409, "PHONE_ALREADY_EXISTS", "Số điện thoại đã được đăng ký"));
    render(<><RegisterForm /><ToastHost /></>);
    fillRegister();
    fireEvent.click(submitBtn(/Đăng ký/));
    const msg = await screen.findByText("Số điện thoại đã được đăng ký");
    expect(msg.id).toBe("phone-error");
    expect(screen.getByLabelText("Số điện thoại")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "false");
  });
  it("EMAIL_ALREADY_EXISTS gắn vào ô email", async () => {
    register.mockRejectedValue(new ApiError(409, "EMAIL_ALREADY_EXISTS", "Email đã được đăng ký"));
    render(<><RegisterForm /><ToastHost /></>);
    fillRegister();
    fireEvent.click(submitBtn(/Đăng ký/));
    expect((await screen.findByText("Email đã được đăng ký")).id).toBe("email-error");
  });
  it("hiển thị lỗi theo details[].field", async () => {
    register.mockRejectedValue(
      new ApiError(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", [{ field: "fullName", message: "Tên sai" }]),
    );
    render(<><RegisterForm /><ToastHost /></>);
    fillRegister();
    fireEvent.click(submitBtn(/Đăng ký/));
    expect((await screen.findByText("Tên sai")).id).toBe("fullName-error");
  });
  it("nút disable khi đang gửi, chặn gửi đúp", async () => {
    let resolve!: () => void;
    register.mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    render(<><RegisterForm /><ToastHost /></>);
    fillRegister();
    fireEvent.click(submitBtn(/Đăng ký/));
    const btn = await screen.findByRole("button", { name: /Đang xử lý/ });
    expect(btn).toBeDisabled();
    fireEvent.submit(btn.closest("form")!);
    expect(register).toHaveBeenCalledTimes(1);
    resolve();
    await screen.findByText(/Đăng ký thành công/);
  });
  it("gửi đúng payload", async () => {
    register.mockResolvedValue({});
    render(<><RegisterForm /><ToastHost /></>);
    fillRegister();
    fireEvent.click(submitBtn(/Đăng ký/));
    await waitFor(() => expect(register).toHaveBeenCalledWith({
      fullName: "Nguyen Van A", email: "a@b.co", phone: "0912345678",
      password: "123456", confirmPassword: "123456", acceptTerms: true,
    }));
  });
});

describe("LoginForm", () => {
  it("validate rỗng, không gọi login", async () => {
    render(<><LoginForm /><ToastHost /></>);
    fireEvent.click(submitBtn(/Đăng nhập/));
    expect(await screen.findByText(/Vui lòng nhập số điện thoại/)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
  it("thành công chuyển theo role", async () => {
    login.mockResolvedValue("/admin");
    render(<><LoginForm /><ToastHost /></>);
    type("Số điện thoại", "0912345678"); type("Mật khẩu", "abcdef");
    fireEvent.click(submitBtn(/Đăng nhập/));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
    expect(login).toHaveBeenCalledWith("0912345678", "abcdef");
  });
  it("INVALID_CREDENTIALS hiện thông báo chung", async () => {
    login.mockRejectedValue(new ApiError(401, "INVALID_CREDENTIALS", "Số điện thoại hoặc mật khẩu không đúng"));
    render(<><LoginForm /><ToastHost /></>);
    type("Số điện thoại", "0912345678"); type("Mật khẩu", "abcdef");
    fireEvent.click(submitBtn(/Đăng nhập/));
    expect(await screen.findByRole("alert")).toHaveTextContent("Số điện thoại hoặc mật khẩu không đúng");
  });
  it("nút disable khi đang gửi", async () => {
    login.mockReturnValue(new Promise(() => {}));
    render(<><LoginForm /><ToastHost /></>);
    type("Số điện thoại", "0912345678"); type("Mật khẩu", "abcdef");
    fireEvent.click(submitBtn(/Đăng nhập/));
    expect(await screen.findByRole("button", { name: /Đang đăng nhập/ })).toBeDisabled();
  });
});
