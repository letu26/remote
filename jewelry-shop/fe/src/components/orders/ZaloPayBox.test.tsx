import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createPayment = vi.fn();
const status = vi.fn();
vi.mock("@/services/zalopay.service", () => ({ zalopayService: { createPayment: (...a: unknown[]) => createPayment(...a), status: (...a: unknown[]) => status(...a) } }));
vi.mock("@/utils/notify", () => ({ notify: vi.fn() }));
vi.mock("qrcode.react", () => ({ QRCodeSVG: ({ value }: { value: string }) => <svg data-testid="qr" data-value={value} /> }));

import { ZaloPayBox } from "./ZaloPayBox";

const payment = () => ({
  appTransId: "261023_LG1_1",
  orderUrl: "https://sbgateway.zalopay.vn/openinapp?order=abc",
  amount: 3_220_000,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
});

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  createPayment.mockReset();
  status.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ZaloPayBox", () => {
  it("tạo mã một lần, hiện mã QR, số tiền và thời gian còn lại", async () => {
    createPayment.mockResolvedValue(payment());
    status.mockResolvedValue({ status: "pending", expiresAt: payment().expiresAt });
    render(<ZaloPayBox orderCode="LG1" onPaid={() => {}} />);
    expect(await screen.findByTestId("qr")).toHaveAttribute("data-value", "https://sbgateway.zalopay.vn/openinapp?order=abc");
    expect(screen.getByText(/3\.220\.000/)).toBeInTheDocument();
    expect(screen.getByText(/1[45]:\d\d/)).toBeInTheDocument();
    expect(createPayment).toHaveBeenCalledTimes(1);
    expect(createPayment).toHaveBeenCalledWith("LG1");
  });

  it("be báo đã thanh toán -> gọi onPaid đúng một lần", async () => {
    createPayment.mockResolvedValue(payment());
    status.mockResolvedValue({ status: "paid" });
    const onPaid = vi.fn();
    render(<ZaloPayBox orderCode="LG1" onPaid={onPaid} />);
    await screen.findByTestId("qr");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    await waitFor(() => expect(onPaid).toHaveBeenCalledTimes(1));
  });

  it("be báo hết hạn -> hiện nút tạo mã mới và tạo lại khi bấm", async () => {
    createPayment.mockResolvedValue(payment());
    status.mockResolvedValue({ status: "expired" });
    render(<ZaloPayBox orderCode="LG1" onPaid={() => {}} />);
    await screen.findByTestId("qr");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4500);
    });
    const button = await screen.findByRole("button", { name: "Tạo mã mới" });
    await act(async () => {
      button.click();
    });
    await waitFor(() => expect(createPayment).toHaveBeenCalledTimes(2));
  });

  it("tạo mã lỗi -> hiện thông báo và nút thử lại", async () => {
    createPayment.mockRejectedValue(new Error("mạng lỗi"));
    render(<ZaloPayBox orderCode="LG1" onPaid={() => {}} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tạo được mã thanh toán");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
