import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminOrderDetail, AdminOrderListItem } from "@/types/admin-order";
import { ApiError } from "@/utils/errors";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/services/admin-order.service", () => ({
  adminOrderService: { list: vi.fn(), get: vi.fn(), changeStatus: vi.fn(), changePayment: vi.fn() },
}));
vi.mock("@/utils/confirm-note", () => ({ confirmWithNote: vi.fn() }));
const notify = vi.fn();
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => notify(...a) }));

import { adminOrderService } from "@/services/admin-order.service";
import { confirmWithNote } from "@/utils/confirm-note";
import { validateShipping } from "../shipping-config";
import { BankTransferForm, transferPreview, validateBankTransfer } from "../settings/BankTransferForm";
import { InvoiceSheet } from "./OrderInvoice";
import { OrderDetail } from "./OrderDetail";
import { OrderList } from "./OrderList";
import { buildOrderSearch, canCancel, nextStatus, parseOrderFilters } from "./order-meta";

const svc = adminOrderService as unknown as Record<string, ReturnType<typeof vi.fn>>;
const confirmNote = confirmWithNote as unknown as ReturnType<typeof vi.fn>;

function detail(over: Partial<AdminOrderDetail> = {}): AdminOrderDetail {
  return {
    id: 5,
    code: "LG20261017-483920",
    createdAt: "2026-10-17T03:00:00Z",
    status: "pending",
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    paidAt: null,
    cancelReason: null,
    note: null,
    customer: { id: 1, fullName: "Nguyễn Văn A", phone: "0901234567", email: "a@b.co" },
    receiver: { name: "Trần B", phone: "0912345678", province: "Hà Nội", ward: "Phường X", addressDetail: "12 Phố Y" },
    shippingMethodName: "Giao hàng tiêu chuẩn",
    subtotal: 1000000,
    shippingFee: 30000,
    total: 1030000,
    items: [{ productName: "Nhẫn vàng", productCode: "LG-001", size: "12", imageUrl: null, unitPrice: 500000, quantity: 2, lineTotal: 1000000 }],
    history: [{ status: "pending", note: "Đặt hàng", createdAt: "2026-10-17T03:00:00Z", changedByName: null }],
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  search = "";
});
afterEach(cleanup);

describe("bộ lọc <-> URL", () => {
  it("parse bỏ giá trị sai và build lại đúng query", () => {
    const f = parseOrderFilters(new URLSearchParams("status=shipping&paymentStatus=xx&from=2026-10-01&to=bad&page=3&q=LG"));
    expect(f).toEqual({ q: "LG", status: "shipping", paymentStatus: "", from: "2026-10-01", to: "", userId: "", page: 3 });
    expect(buildOrderSearch(f)).toBe("?q=LG&status=shipping&from=2026-10-01&page=3");
    expect(buildOrderSearch(parseOrderFilters(new URLSearchParams()))).toBe("");
  });
  it("luồng trạng thái chỉ đi tới bước kế tiếp", () => {
    expect(nextStatus("pending")).toBe("confirmed");
    expect(nextStatus("shipping")).toBe("delivered");
    expect(nextStatus("delivered")).toBeNull();
    expect(nextStatus("cancelled")).toBeNull();
    expect(canCancel("preparing")).toBe(true);
    expect(canCancel("shipping")).toBe(false);
  });
});

describe("OrderList", () => {
  const item: AdminOrderListItem = {
    id: 5, code: "LG20261017-483920", createdAt: "2026-10-17T03:00:00Z", receiverName: "Trần B", receiverPhone: "0912345678",
    status: "pending", paymentMethod: "cod", paymentStatus: "unpaid", total: 1030000, itemCount: 2,
  };
  const page = { items: [item], page: 1, pageSize: 20, total: 1, totalPages: 1 };

  it("đọc bộ lọc từ URL và gửi lên service", async () => {
    search = "status=shipping&paymentStatus=paid&from=2026-10-01&to=2026-10-31&q=Tran&page=2";
    svc.list.mockResolvedValue(page);
    render(<OrderList />);
    await waitFor(() => expect(svc.list).toHaveBeenCalled());
    expect(svc.list.mock.calls[0][0]).toMatchObject({
      status: "shipping", paymentStatus: "paid", from: "2026-10-01", to: "2026-10-31", q: "Tran", page: 2,
    });
    expect(screen.getByLabelText("Tìm kiếm")).toHaveValue("Tran");
  });

  it("đổi bộ lọc trạng thái ghi lên URL và về trang 1", async () => {
    search = "page=3";
    svc.list.mockResolvedValue(page);
    render(<OrderList />);
    await screen.findAllByText("LG20261017-483920");
    fireEvent.change(screen.getByLabelText("Trạng thái đơn"), { target: { value: "confirmed" } });
    expect(replace).toHaveBeenCalledWith("/admin/orders?status=confirmed", { scroll: false });
  });

  it("tìm kiếm chỉ ghi lên URL sau 500ms dừng gõ", async () => {
    svc.list.mockResolvedValue(page);
    render(<OrderList />);
    await screen.findAllByText("LG20261017-483920");
    fireEvent.change(screen.getByLabelText("Tìm kiếm"), { target: { value: "0912" } });
    expect(replace).not.toHaveBeenCalled();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/orders?q=0912", { scroll: false }), { timeout: 2000 });
  });

  it("hiện trạng thái rỗng khi không có đơn", async () => {
    svc.list.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 });
    render(<OrderList />);
    expect(await screen.findByText("Chưa có đơn hàng nào")).toBeInTheDocument();
  });
});

describe("OrderDetail", () => {
  const buttons = () => screen.queryAllByRole("button").map((b) => b.textContent);

  it("pending: chỉ hiện bước Xác nhận đơn và Hủy đơn, không có nhảy cóc", async () => {
    svc.get.mockResolvedValue(detail());
    render(<OrderDetail orderId={5} />);
    await screen.findByText("Nguyễn Văn A");
    expect(buttons()).toEqual(["Xác nhận đơn", "Hủy đơn"]);
    expect(screen.getByText("Hệ thống", { exact: false })).toBeInTheDocument();
  });
  it("shipping: chỉ còn Hoàn tất giao hàng, không hủy được; delivered: không có nút nào", async () => {
    svc.get.mockResolvedValue(detail({ status: "shipping" }));
    render(<OrderDetail orderId={5} />);
    await screen.findByText("Nguyễn Văn A");
    expect(buttons()).toEqual(["Hoàn tất giao hàng"]);
    cleanup();
    svc.get.mockResolvedValue(detail({ status: "delivered" }));
    render(<OrderDetail orderId={5} />);
    await screen.findByText("Nguyễn Văn A");
    expect(buttons()).toEqual([]);
  });

  it("xác nhận bằng swal kèm ghi chú rồi gọi API; hủy swal thì không gọi", async () => {
    svc.get.mockResolvedValue(detail());
    svc.changeStatus.mockResolvedValue(detail({ status: "confirmed" }));
    render(<OrderDetail orderId={5} />);
    await screen.findByText("Nguyễn Văn A");
    confirmNote.mockResolvedValueOnce(null);
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    await waitFor(() => expect(confirmNote).toHaveBeenCalledTimes(1));
    expect(svc.changeStatus).not.toHaveBeenCalled();
    confirmNote.mockResolvedValueOnce("Đã gọi khách");
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    await waitFor(() => expect(svc.changeStatus).toHaveBeenCalledWith(5, "confirmed", "Đã gọi khách"));
    expect(await screen.findByRole("button", { name: "Chuẩn bị hàng" })).toBeInTheDocument();
    expect(notify).toHaveBeenCalledWith("success", expect.stringContaining("Đã xác nhận"));
  });

  it("Hủy đơn gửi status cancelled kèm lý do", async () => {
    svc.get.mockResolvedValue(detail({ status: "preparing" }));
    svc.changeStatus.mockResolvedValue(detail({ status: "cancelled", cancelReason: "Hết hàng" }));
    render(<OrderDetail orderId={5} />);
    await screen.findByText("Nguyễn Văn A");
    confirmNote.mockResolvedValueOnce("Hết hàng");
    fireEvent.click(screen.getByRole("button", { name: "Hủy đơn" }));
    await waitFor(() => expect(svc.changeStatus).toHaveBeenCalledWith(5, "cancelled", "Hết hàng"));
    expect(await screen.findByText(/Lý do hủy: Hết hàng/)).toBeInTheDocument();
  });

  it("INVALID_STATUS_TRANSITION: tải lại đơn và báo lỗi", async () => {
    svc.get.mockResolvedValueOnce(detail()).mockResolvedValueOnce(detail({ status: "confirmed" }));
    svc.changeStatus.mockRejectedValue(new ApiError(409, "INVALID_STATUS_TRANSITION", "Đơn đã được xử lý bởi người khác"));
    render(<OrderDetail orderId={5} />);
    await screen.findByText("Nguyễn Văn A");
    confirmNote.mockResolvedValueOnce("");
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    await waitFor(() => expect(svc.get).toHaveBeenCalledTimes(2));
    expect(notify).toHaveBeenCalledWith("error", "Đơn đã được xử lý bởi người khác");
    expect(await screen.findByRole("button", { name: "Chuẩn bị hàng" })).toBeInTheDocument();
  });

  it("chuyển khoản chưa thanh toán: xác nhận đã thanh toán; COD thì không có nút", async () => {
    svc.get.mockResolvedValue(detail({ paymentMethod: "bank_transfer" }));
    svc.changePayment.mockResolvedValue(detail({ paymentMethod: "bank_transfer", paymentStatus: "paid", paidAt: "2026-10-17T05:00:00Z" }));
    render(<OrderDetail orderId={5} />);
    await screen.findByText("Nguyễn Văn A");
    confirmNote.mockResolvedValueOnce("");
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đã thanh toán" }));
    await waitFor(() => expect(svc.changePayment).toHaveBeenCalledWith(5, "paid", undefined));
    expect(await screen.findByRole("button", { name: "Hủy xác nhận thanh toán" })).toBeInTheDocument();
    cleanup();
    svc.get.mockResolvedValue(detail());
    render(<OrderDetail orderId={5} />);
    await screen.findByText("Nguyễn Văn A");
    expect(screen.queryByRole("button", { name: /thanh toán/ })).toBeNull();
    expect(screen.getByRole("link", { name: "In hóa đơn" })).toHaveAttribute("href", "/admin/orders/5/invoice");
  });
});

describe("InvoiceSheet", () => {
  it("hiển thị đủ nội dung hóa đơn", () => {
    render(<InvoiceSheet order={detail({ paymentMethod: "bank_transfer", paymentStatus: "paid" })} />);
    expect(screen.getByText("Lumière Gems")).toBeInTheDocument();
    expect(screen.getByText("LG20261017-483920")).toBeInTheDocument();
    expect(screen.getByText("Trần B")).toBeInTheDocument();
    expect(screen.getByText("Nhẫn vàng")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Tạm tính")).toBeInTheDocument();
    expect(screen.getByText(/Phí vận chuyển/)).toBeInTheDocument();
    expect(screen.getByText("Tổng cộng")).toBeInTheDocument();
    expect(screen.getByText(/Chuyển khoản ngân hàng/)).toBeInTheDocument();
    expect(screen.getByText(/Đã thanh toán/)).toBeInTheDocument();
  });
});

describe("validate cài đặt chuyển khoản / vận chuyển", () => {
  const ok = { bankName: "ACB", accountNumber: "0123 4567", accountHolder: "CTY A", transferNote: "TT {orderCode}" };
  it("hợp lệ", () => expect(validateBankTransfer(ok)).toEqual({}));
  it("mẫu nội dung phải chứa {orderCode}", () => {
    expect(validateBankTransfer({ ...ok, transferNote: "Thanh toan" }).transferNote).toMatch(/\{orderCode\}/);
    expect(validateBankTransfer({ ...ok, transferNote: "" }).transferNote).toBeTruthy();
  });
  it("số tài khoản 4..30, chỉ chữ số/khoảng trắng; các trường bắt buộc", () => {
    expect(validateBankTransfer({ ...ok, accountNumber: "12a4" }).accountNumber).toBeTruthy();
    expect(validateBankTransfer({ ...ok, accountNumber: "123" }).accountNumber).toBeTruthy();
    expect(validateBankTransfer({ ...ok, bankName: " ", accountHolder: "" })).toMatchObject({ bankName: expect.any(String), accountHolder: expect.any(String) });
  });
  it("xem trước thay {orderCode}", () => {
    expect(transferPreview("TT {orderCode}", "LG1")).toBe("TT LG1");
  });
  it("phí vận chuyển là số nguyên >= 0", () => {
    const v = { name: "Nhanh", description: "", fee: "30000", isActive: true };
    expect(validateShipping(v)).toEqual({});
    expect(validateShipping({ ...v, fee: "-1" }).fee).toBeTruthy();
    expect(validateShipping({ ...v, fee: "1.5" }).fee).toBeTruthy();
    expect(validateShipping({ ...v, name: "N" }).name).toBeTruthy();
  });
});

describe("BankTransferForm", () => {
  it("không lưu khi thiếu {orderCode}, lưu đúng payload và báo toast", async () => {
    const { adminSettingsService } = await import("@/services/admin-settings.service");
    const get = vi.spyOn(adminSettingsService, "getBankTransfer").mockResolvedValue({
      bankName: "ACB", accountNumber: "0123456789", accountHolder: "CTY", transferNote: "{orderCode}",
    });
    const save = vi.spyOn(adminSettingsService, "saveBankTransfer").mockImplementation(async (v) => v);
    render(<BankTransferForm />);
    await screen.findByDisplayValue("ACB");
    fireEvent.change(screen.getByLabelText("Mẫu nội dung chuyển khoản"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu cài đặt" }));
    expect(await screen.findByText(/phải chứa \{orderCode\}/)).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Mẫu nội dung chuyển khoản"), { target: { value: "DH {orderCode}" } });
    expect(screen.getByTestId("transfer-preview")).toHaveTextContent("DH LG20261017-483920");
    fireEvent.click(screen.getByRole("button", { name: "Lưu cài đặt" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ transferNote: "DH {orderCode}" })));
    expect(notify).toHaveBeenCalledWith("success", "Đã lưu thông tin chuyển khoản");
    get.mockRestore();
  });
});
