import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastHost } from "@/components/ui/ToastHost";
import { ApiError } from "@/utils/errors";

const replace = vi.fn();
// Router ổn định giữa các lần render, giống next/navigation thật.
const router = { replace, push: vi.fn() };
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => router }));
const verifyOtp = vi.fn();
const forgotPassword = vi.fn();
vi.mock("@/services/auth.service", () => ({
  authService: {
    verifyOtp: (...a: unknown[]) => verifyOtp(...a),
    forgotPassword: (...a: unknown[]) => forgotPassword(...a),
  },
}));

import { getResetToken, setOtpTimers, setResetEmail } from "@/store/reset-flow";
import { VerifyOtpForm } from "./VerifyOtpForm";

const flush = () =>
  act(async () => {
    await Promise.resolve();
  });
const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
const digitInput = (i: number) => screen.getByLabelText(`Chữ số thứ ${i}`);
const paste = (text: string) =>
  fireEvent.paste(digitInput(1), { clipboardData: { getData: () => text } });
const confirm = () => fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  verifyOtp.mockReset();
  forgotPassword.mockReset();
  replace.mockClear();
  setResetEmail("a@b.co");
  setOtpTimers(120, 60);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("VerifyOtpForm", () => {
  it("không có email trong sessionStorage thì về /forgot-password", async () => {
    sessionStorage.clear();
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    expect(replace).toHaveBeenCalledWith("/forgot-password");
  });
  it("đếm ngược 2:00 và nút gửi lại bật sau 60 giây", async () => {
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    expect(screen.getByText("2:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gửi lại mã/ })).toBeDisabled();
    await advance(30_000);
    expect(screen.getByText("1:30")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gửi lại mã/ })).toBeDisabled();
    await advance(30_000);
    expect(screen.getByRole("button", { name: "Gửi lại mã" })).toBeEnabled();
  });
  it("hết 2 phút thì báo hết hạn và khóa nút xác nhận", async () => {
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    await advance(120_000);
    expect(screen.getByRole("alert")).toHaveTextContent(/hết hạn/);
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled();
  });
  it("gửi lại mã đặt lại đồng hồ và nút gửi lại", async () => {
    forgotPassword.mockResolvedValue({ expiresInSeconds: 120, resendAfterSeconds: 60 });
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    await advance(120_000);
    fireEvent.click(screen.getByRole("button", { name: "Gửi lại mã" }));
    await flush();
    expect(forgotPassword).toHaveBeenCalledWith("a@b.co");
    expect(screen.getByText("2:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gửi lại mã \(60s\)/ })).toBeDisabled();
  });
  it("OTP thiếu số: báo lỗi, không gọi API", async () => {
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    fireEvent.change(digitInput(1), { target: { value: "1" } });
    confirm();
    await flush();
    expect(screen.getByText(/đúng 6 chữ số/)).toBeInTheDocument();
    expect(verifyOtp).not.toHaveBeenCalled();
  });
  it("dán 6 số, đúng thì lưu resetToken và chuyển /reset-password", async () => {
    verifyOtp.mockResolvedValue({ resetToken: "rt", expiresInSeconds: 600 });
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    paste("123 456");
    expect(digitInput(6)).toHaveValue("6");
    confirm();
    await flush();
    expect(verifyOtp).toHaveBeenCalledWith("a@b.co", "123456");
    expect(getResetToken()).toBe("rt");
    expect(replace).toHaveBeenCalledWith("/reset-password");
  });
  it("chỉ nhận chữ số", async () => {
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    fireEvent.change(digitInput(1), { target: { value: "a" } });
    expect(digitInput(1)).toHaveValue("");
  });
  it("OTP_INVALID hiện lỗi và vẫn cho nhập lại", async () => {
    verifyOtp.mockRejectedValue(new ApiError(400, "OTP_INVALID", "Mã OTP không đúng, còn 4 lần thử"));
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    paste("111111");
    confirm();
    await flush();
    expect(screen.getByRole("alert")).toHaveTextContent("còn 4 lần thử");
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeEnabled();
  });
  it("OTP_INVALID hiện Còn X lần thử, đổi màu khi còn 1", async () => {
    verifyOtp.mockRejectedValueOnce(new ApiError(400, "OTP_INVALID", "Sai", [], undefined, 4));
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    paste("111111");
    confirm();
    await flush();
    expect(screen.getByTestId("attempts-left")).toHaveTextContent("Còn 4 lần thử");
    expect(screen.getByTestId("attempts-left").className).not.toMatch(/text-danger/);
    verifyOtp.mockRejectedValueOnce(new ApiError(400, "OTP_INVALID", "Sai", [], undefined, 1));
    paste("222222");
    confirm();
    await flush();
    expect(screen.getByTestId("attempts-left")).toHaveTextContent("Còn 1 lần thử");
    expect(screen.getByTestId("attempts-left").className).toMatch(/text-danger/);
  });
  it("thiếu remainingAttempts: chỉ hiện message, không hiện dòng số lần", async () => {
    verifyOtp.mockRejectedValue(new ApiError(400, "OTP_INVALID", "Mã OTP không đúng"));
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    paste("111111");
    confirm();
    await flush();
    expect(screen.queryByTestId("attempts-left")).toBeNull();
    expect(screen.getByRole("alert")).toHaveTextContent("Mã OTP không đúng");
  });
  it("gửi lại mã xóa dòng số lần thử", async () => {
    verifyOtp.mockRejectedValue(new ApiError(400, "OTP_INVALID", "Sai", [], undefined, 3));
    forgotPassword.mockResolvedValue({ expiresInSeconds: 120, resendAfterSeconds: 60 });
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    paste("111111");
    confirm();
    await flush();
    expect(screen.getByTestId("attempts-left")).toBeInTheDocument();
    await advance(60_000);
    fireEvent.click(screen.getByRole("button", { name: "Gửi lại mã" }));
    await flush();
    expect(screen.queryByTestId("attempts-left")).toBeNull();
  });
  it("TOO_MANY_ATTEMPTS khóa ô nhập, nút gửi lại tôn trọng cooldown", async () => {
    verifyOtp.mockRejectedValue(new ApiError(429, "OTP_TOO_MANY_ATTEMPTS", "Quá nhiều"));
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    paste("111111");
    confirm();
    await flush();
    expect(digitInput(1)).toBeDisabled();
    expect(screen.getByText(/yêu cầu mã mới/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gửi lại mã \(/ })).toBeDisabled();
    await advance(60_000);
    expect(screen.getByRole("button", { name: "Gửi lại mã" })).toBeEnabled();
  });
  it("OTP_TOO_MANY_ATTEMPTS khóa xác nhận, yêu cầu gửi lại", async () => {
    verifyOtp.mockRejectedValue(new ApiError(429, "OTP_TOO_MANY_ATTEMPTS", "Nhập sai quá nhiều lần"));
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    paste("111111");
    confirm();
    await flush();
    expect(screen.getAllByRole("alert").map((a) => a.textContent).join(" ")).toMatch(/quá nhiều/);
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled();
  });
  it("gửi lại bị OTP_RATE_LIMITED: khóa nút theo retryAfterSeconds", async () => {
    forgotPassword.mockRejectedValue(new ApiError(429, "OTP_RATE_LIMITED", "Quá nhanh", [], 20));
    render(<><VerifyOtpForm /><ToastHost /></>);
    await flush();
    await advance(60_000);
    fireEvent.click(screen.getByRole("button", { name: "Gửi lại mã" }));
    await flush();
    expect(screen.getByText(/thử lại sau 20 giây/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gửi lại mã \(20s\)/ })).toBeDisabled();
  });
});
