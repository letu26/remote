import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/utils/errors";

const m = vi.hoisted(() => ({
  replace: vi.fn(),
  notify: vi.fn(),
  confirm: vi.fn(),
  confirmNote: vi.fn(),
  selfId: { value: 1 as number | null },
  search: { value: "" },
  stats: { overview: vi.fn(), revenue: vi.fn(), ordersByStatus: vi.fn(), topProducts: vi.fn(), lowStock: vi.fn(), topCustomers: vi.fn() },
  promo: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  customer: { list: vi.fn(), get: vi.fn(), setStatus: vi.fn(), setRole: vi.fn() },
  product: { list: vi.fn(), get: vi.fn() },
  order: { list: vi.fn() },
}));

vi.mock("next/navigation", () => {
  const cache = new Map<string, URLSearchParams>();
  return {
    useRouter: () => ({ replace: m.replace, push: vi.fn() }),
    usePathname: () => "/admin/x",
    useSearchParams: () => {
      const key = m.search.value;
      if (!cache.has(key)) cache.set(key, new URLSearchParams(key));
      return cache.get(key)!;
    },
  };
});
vi.mock("@/services/admin-stats.service", () => ({ adminStatsService: m.stats }));
vi.mock("@/services/admin-promotion.service", () => ({ adminPromotionService: m.promo }));
vi.mock("@/services/admin-customer.service", () => ({ adminCustomerService: m.customer }));
vi.mock("@/services/admin-product.service", () => ({ adminProductService: m.product }));
vi.mock("@/services/admin-order.service", () => ({ adminOrderService: m.order }));
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => m.notify(...a) }));
vi.mock("@/utils/confirm", () => ({ confirmAction: (...a: unknown[]) => m.confirm(...a) }));
vi.mock("@/utils/confirm-note", () => ({ confirmWithNote: (...a: unknown[]) => m.confirmNote(...a) }));
vi.mock("@/store/auth-context", () => ({ useAuth: () => ({ user: m.selfId.value === null ? null : { id: m.selfId.value } }) }));

import { CustomerDetail } from "./customer/CustomerDetail";
import { CustomerList, buildCustomerSearch, parseCustomerFilters } from "./customer/CustomerList";
import { customerActions } from "./customer/customer-actions";
import { buildChart, formatCompactVND, formatPeriodLabel, niceScale } from "./dashboard/chart-utils";
import { Dashboard } from "./dashboard/Dashboard";
import { RevenueChart } from "./dashboard/RevenueChart";
import { addDays, daysInclusive, fromLocalInputValue, presetRange, toLocalInputValue, validateRange, vnDateString } from "./dashboard/date-utils";
import { OrderList } from "./order/OrderList";
import { buildOrderSearch, parseOrderFilters } from "./order/order-meta";
import { PromotionList } from "./promotion/PromotionList";
import { findOverlaps, previewPrice, validatePromotionForm, emptyPromotionForm } from "./promotion/promotion-form";

beforeEach(() => {
  vi.clearAllMocks();
  m.search.value = "";
  m.selfId.value = 1;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const mock = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

describe("tiện ích ngày giờ", () => {
  it("ngày Việt Nam (UTC+7) và cộng/trừ ngày", () => {
    expect(vnDateString(new Date("2026-10-17T18:00:00Z"))).toBe("2026-10-18");
    expect(vnDateString(new Date("2026-10-17T16:59:00Z"))).toBe("2026-10-17");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(presetRange(7, "2026-10-18")).toEqual({ from: "2026-10-12", to: "2026-10-18" });
    expect(daysInclusive("2026-10-12", "2026-10-18")).toBe(7);
  });
  it("kiểm tra khoảng ngày: thứ tự, định dạng, tối đa 366 ngày", () => {
    expect(validateRange("2026-01-01", "2026-12-31")).toBeUndefined();
    expect(validateRange("2026-10-18", "2026-10-01")).toBeTruthy();
    expect(validateRange("2026-02-30", "2026-03-01")).toBeTruthy();
    expect(validateRange("2025-01-01", "2026-01-02")).toBeTruthy();
    expect(validateRange("2024-01-01", "2024-12-31")).toBeUndefined(); // năm nhuận: đúng 366 ngày
  });
  it("giờ địa phương <-> ISO có múi giờ (khứ hồi)", () => {
    const local = new Date(2026, 9, 17, 10, 30); // giờ địa phương của máy chạy test
    const iso = fromLocalInputValue("2026-10-17T10:30");
    expect(iso).toBe(local.toISOString());
    expect(iso).toMatch(/Z$/);
    expect(toLocalInputValue(iso as string)).toBe("2026-10-17T10:30");
    expect(fromLocalInputValue("")).toBeNull();
    expect(fromLocalInputValue("abc")).toBeNull();
  });
});

describe("dữ liệu biểu đồ", () => {
  it("rút gọn tiền: nghìn, triệu, tỷ", () => {
    expect(formatCompactVND(500000)).toBe("500 nghìn");
    expect(formatCompactVND(1500000)).toBe("1,5 tr");
    expect(formatCompactVND(2000000000)).toBe("2 tỷ");
    expect(formatCompactVND(0)).toBe("0");
  });
  it("thang đo đẹp, bao được giá trị lớn nhất; rỗng vẫn hợp lệ", () => {
    const s = niceScale(5800000);
    expect(s.max).toBeGreaterThanOrEqual(5800000);
    expect(s.ticks[0]).toBe(0);
    expect(s.ticks.at(-1)).toBe(s.max);
    const empty = niceScale(0);
    expect(empty.max).toBeGreaterThan(0);
    expect(empty.ticks.length).toBeGreaterThan(1);
  });
  it("nhãn kỳ và kỳ rỗng", () => {
    expect(formatPeriodLabel("2026-10-17", "day")).toBe("17/10");
    expect(formatPeriodLabel("2026-10", "month")).toBe("10/2026");
    expect(buildChart([], { width: 700, height: 280 }).empty).toBe(true);
    expect(buildChart([{ period: "2026-10-17", orders: 0, revenue: 0 }], { width: 700, height: 280 }).empty).toBe(true);
    const g = buildChart([{ period: "a", orders: 1, revenue: 100 }, { period: "b", orders: 2, revenue: 50 }], { width: 700, height: 280 });
    expect(g.empty).toBe(false);
    expect(g.bars[0].height).toBeGreaterThan(g.bars[1].height);
  });
  it("biểu đồ có bảng thay thế và chú thích khi focus", () => {
    const pts = [{ period: "2026-10-17", orders: 2, revenue: 5800000 }, { period: "2026-10-18", orders: 1, revenue: 1000000 }];
    render(<RevenueChart points={pts} granularity="day" />);
    expect(screen.getByRole("table", { name: "Số liệu doanh thu theo kỳ" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    const bar = screen.getByRole("img", { name: /17\/10\/2026: 2 đơn/ });
    fireEvent.focus(bar);
    expect(screen.getByTestId("chart-tooltip")).toHaveTextContent("17/10/2026");
    expect(screen.getByTestId("chart-tooltip")).toHaveTextContent("2 đơn");
    fireEvent.blur(bar);
    expect(screen.getByTestId("chart-tooltip")).toHaveTextContent("Rê chuột");
    fireEvent.click(screen.getByRole("button", { name: "Xem bảng số liệu" }));
    expect(screen.getByRole("button", { name: "Ẩn bảng số liệu" })).toBeInTheDocument();
  });
  it("kỳ rỗng hiện thông báo", () => {
    render(<RevenueChart points={[]} granularity="day" />);
    expect(screen.getByText(/Chưa có doanh thu/)).toBeInTheDocument();
  });
});

describe("Dashboard", () => {
  const overview = {
    range: { from: "2026-09-19", to: "2026-10-18" }, pendingOrders: 3, today: { orders: 2, revenue: 5800000 }, thisMonth: { orders: 40, revenue: 120000000 },
    inRange: { orders: 55, revenue: 160000000, averageOrderValue: 2909091 }, totalCustomers: 120, totalProducts: 14, lowStockProducts: 2,
  };
  const setupOk = () => {
    mock(m.stats.overview).mockResolvedValue(overview);
    mock(m.stats.revenue).mockResolvedValue([{ period: "2026-10-18", orders: 1, revenue: 1000000 }]);
    mock(m.stats.ordersByStatus).mockResolvedValue({ pending: 3, confirmed: 0, preparing: 0, shipping: 1, delivered: 9, cancelled: 2 });
    mock(m.stats.topProducts).mockResolvedValue([{ productCode: "LG-1", productName: "Nhẫn A", quantity: 4, revenue: 4000000, productId: 9 }]);
    mock(m.stats.lowStock).mockResolvedValue([{ productId: 5, productCode: "LG-2", productName: "Dây B", variantId: 1, sku: "S1", size: "", stock: 1 }]);
    mock(m.stats.topCustomers).mockResolvedValue([{ userId: 7, fullName: "Nguyễn Văn A", phone: "0901", orders: 3, totalSpent: 9000000 }]);
  };
  const fakeNow = () => vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-18T05:00:00Z") });

  it("hiện thẻ chỉ số, liên kết và các bảng; gọi API với khoảng 30 ngày mặc định", async () => {
    fakeNow();
    setupOk();
    render(<Dashboard />);
    expect(await screen.findByRole("link", { name: /Đơn chờ xác nhận/ })).toHaveAttribute("href", "/admin/orders?status=pending");
    expect(m.stats.overview.mock.calls[0][0]).toEqual({ from: "2026-09-19", to: "2026-10-18" });
    expect(await screen.findByRole("link", { name: "Nhẫn A" })).toHaveAttribute("href", "/admin/products/9");
    expect(await screen.findByRole("link", { name: "Dây B" })).toHaveAttribute("href", "/admin/products/5");
    expect(await screen.findByRole("link", { name: "Nguyễn Văn A" })).toHaveAttribute("href", "/admin/customers/7");
    expect(screen.getByTestId("status-count-delivered")).toHaveTextContent("9");
  });

  it("một khối lỗi không làm hỏng các khối khác; thử lại gọi lại đúng khối", async () => {
    fakeNow();
    setupOk();
    mock(m.stats.topProducts).mockRejectedValueOnce(new Error("x"));
    render(<Dashboard />);
    const block = await screen.findByRole("region", { name: "Sản phẩm bán chạy" });
    await within(block).findByRole("alert");
    expect(await screen.findByRole("link", { name: "Dây B" })).toBeInTheDocument();
    fireEvent.click(within(block).getByRole("button", { name: "Thử lại" }));
    expect(await within(block).findByRole("link", { name: "Nhẫn A" })).toBeInTheDocument();
    expect(m.stats.topCustomers).toHaveBeenCalledTimes(1);
  });

  it("đổi khoảng ngày: hủy request cũ và bỏ kết quả cũ; chọn nhanh ghi lên URL", async () => {
    fakeNow();
    setupOk();
    const signals: AbortSignal[] = [];
    let resolveOld!: (v: unknown) => void;
    mock(m.stats.topProducts).mockImplementation((_r: unknown, _l: number, signal: AbortSignal) => {
      signals.push(signal);
      return signals.length === 1
        ? new Promise((res) => (resolveOld = res))
        : Promise.resolve([{ productCode: "NEW", productName: "Sản phẩm mới", quantity: 1, revenue: 1, productId: 1 }]);
    });
    const { rerender } = render(<Dashboard />);
    await screen.findByRole("link", { name: /Đơn chờ xác nhận/ });
    fireEvent.click(screen.getByRole("button", { name: "7 ngày" }));
    expect(m.replace).toHaveBeenCalledWith("/admin/x?days=7", { scroll: false });
    m.search.value = "days=7";
    rerender(<Dashboard />);
    expect(await screen.findByRole("link", { name: "Sản phẩm mới" })).toBeInTheDocument();
    expect(signals[0].aborted).toBe(true);
    expect(m.stats.overview.mock.calls.at(-1)?.[0]).toEqual({ from: "2026-10-12", to: "2026-10-18" });
    await act(async () => resolveOld([{ productCode: "OLD", productName: "Sản phẩm cũ", quantity: 9, revenue: 9, productId: 2 }]));
    expect(screen.queryByText("Sản phẩm cũ")).toBeNull();
  });

  it("khoảng tùy chọn: kiểm tra tối đa 366 ngày trước khi ghi URL", async () => {
    fakeNow();
    setupOk();
    render(<Dashboard />);
    await screen.findByRole("link", { name: /Đơn chờ xác nhận/ });
    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "2024-01-01" } });
    fireEvent.change(screen.getByLabelText("Đến ngày"), { target: { value: "2026-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
    expect(await screen.findByText(/tối đa 366 ngày/)).toBeInTheDocument();
    expect(m.replace).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "2026-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
    expect(m.replace).toHaveBeenCalledWith("/admin/x?from=2026-01-01&to=2026-01-01", { scroll: false });
  });
});

describe("khuyến mại", () => {
  const promo = (over = {}) => ({
    id: 1, name: "Sale thu", productId: 9, productCode: "LG-1", productName: "Nhẫn A", discountPercent: 20,
    startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-10-31T00:00:00Z", isActive: true, status: "active", createdAt: "2026-09-30T00:00:00Z", ...over,
  });
  const page = (items: unknown[]) => ({ items, page: 1, pageSize: 20, total: items.length, totalPages: 1 });

  it("validate form: tên, sản phẩm, 1..90, bắt đầu < kết thúc", () => {
    const v = { ...emptyPromotionForm(), name: "Sale", products: [{ id: 1, code: "A", name: "A", price: 1000 }], startsAt: "2026-10-01T10:00", endsAt: "2026-10-02T10:00" };
    expect(validatePromotionForm(v, "create")).toEqual({});
    expect(validatePromotionForm({ ...v, products: [] }, "create").productIds).toBeTruthy();
    expect(validatePromotionForm({ ...v, products: [] }, "edit").productIds).toBeUndefined();
    expect(validatePromotionForm({ ...v, discountPercent: "91" }, "create").discountPercent).toBeTruthy();
    expect(validatePromotionForm({ ...v, discountPercent: "0" }, "create").discountPercent).toBeTruthy();
    expect(validatePromotionForm({ ...v, endsAt: v.startsAt }, "create").endsAt).toBeTruthy();
    expect(validatePromotionForm({ ...v, startsAt: "" }, "create").startsAt).toBeTruthy();
    expect(previewPrice(1000000, 15)).toBe(850000);
  });
  it("phát hiện trùng thời gian chỉ với khuyến mại bật, chưa hết hạn, cùng sản phẩm", () => {
    const list = [promo(), promo({ id: 2, productId: 10 }), promo({ id: 3, status: "expired" }), promo({ id: 4, isActive: false, status: "disabled" })] as never[];
    expect(findOverlaps(list, [9], "2026-10-15T00:00:00Z", "2026-11-15T00:00:00Z").map((p) => p.id)).toEqual([1]);
    expect(findOverlaps(list, [9], "2026-11-15T00:00:00Z", "2026-12-15T00:00:00Z")).toEqual([]);
    expect(findOverlaps(list, [9], "2026-10-15T00:00:00Z", "2026-11-15T00:00:00Z", 1)).toEqual([]);
  });

  it("lọc trạng thái ghi lên URL; xóa: hủy swal không gọi API, xác nhận thì gọi", async () => {
    mock(m.promo.list).mockResolvedValue(page([promo()]));
    mock(m.promo.remove).mockResolvedValue(undefined);
    render(<PromotionList />);
    await screen.findAllByText("Sale thu");
    fireEvent.change(screen.getByLabelText("Trạng thái"), { target: { value: "upcoming" } });
    expect(m.replace).toHaveBeenCalledWith("/admin/x?status=upcoming", { scroll: false });
    const del = screen.getAllByRole("button", { name: /Xóa Sale thu/ })[0];
    mock(m.confirm).mockResolvedValueOnce(false);
    fireEvent.click(del);
    await waitFor(() => expect(m.confirm).toHaveBeenCalledTimes(1));
    expect(m.promo.remove).not.toHaveBeenCalled();
    mock(m.confirm).mockResolvedValueOnce(true);
    fireEvent.click(del);
    await waitFor(() => expect(m.promo.remove).toHaveBeenCalledWith(1));
  });

  it("bật/tắt nhanh gọi PATCH isActive", async () => {
    mock(m.promo.list).mockResolvedValue(page([promo()]));
    mock(m.promo.update).mockResolvedValue(promo());
    render(<PromotionList />);
    await screen.findAllByText("Sale thu");
    fireEvent.click(screen.getAllByRole("button", { name: /Tắt Sale thu/ })[0]);
    await waitFor(() => expect(m.promo.update).toHaveBeenCalledWith(1, { isActive: false }));
  });

  it("modal tạo: tìm sản phẩm debounce, chọn nhiều, giá minh họa, cảnh báo trùng, gửi ISO, lỗi theo trường", async () => {
    mock(m.promo.list).mockResolvedValue(page([promo()]));
    mock(m.product.list).mockResolvedValue({
      items: [
        { id: 9, code: "LG-1", name: "Nhẫn A", price: 1000000 },
        { id: 11, code: "LG-3", name: "Nhẫn C", price: 2000000 },
      ],
      page: 1, pageSize: 20, total: 2, totalPages: 1,
    });
    mock(m.promo.create).mockRejectedValueOnce(new ApiError(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", [{ field: "productIds", message: "Sản phẩm 11 không tồn tại" }, { field: "endsAt", message: "Kết thúc phải sau bắt đầu" }]));
    render(<PromotionList />);
    await screen.findAllByText("Sale thu");
    fireEvent.click(screen.getByRole("button", { name: "Thêm khuyến mại" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Tìm sản phẩm"), { target: { value: "nhan" } });
    expect(m.product.list).not.toHaveBeenCalled();
    await waitFor(() => expect(m.product.list).toHaveBeenCalledWith({ q: "nhan", pageSize: 20 }), { timeout: 2000 });
    fireEvent.click(await within(dialog).findByLabelText(/Nhẫn A/));
    fireEvent.click(within(dialog).getByLabelText(/Nhẫn C/));
    expect(within(dialog).getByText(/2\/100 đã chọn/)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Tên khuyến mại"), { target: { value: "Sale mới" } });
    fireEvent.change(within(dialog).getByLabelText(/Phần trăm giảm/), { target: { value: "10" } });
    fireEvent.change(within(dialog).getByLabelText("Bắt đầu"), { target: { value: "2026-10-15T08:00" } });
    fireEvent.change(within(dialog).getByLabelText("Kết thúc"), { target: { value: "2026-11-15T08:00" } });
    expect(within(dialog).getByTestId("price-preview")).toHaveTextContent("900.000");
    expect(within(dialog).getByTestId("overlap-warning")).toHaveTextContent("mức giảm cao nhất");
    fireEvent.click(within(dialog).getByRole("button", { name: "Tạo khuyến mại" }));
    await waitFor(() => expect(m.promo.create).toHaveBeenCalledTimes(1));
    const body = m.promo.create.mock.calls[0][0];
    expect(body).toMatchObject({ name: "Sale mới", productIds: [9, 11], discountPercent: 10, isActive: true });
    expect(body.startsAt).toBe(new Date(2026, 9, 15, 8, 0).toISOString());
    expect(await within(dialog).findByText("Sản phẩm 11 không tồn tại")).toBeInTheDocument();
    expect(within(dialog).getByText("Kết thúc phải sau bắt đầu")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Kết thúc")).toHaveAttribute("aria-invalid", "true");
  });

  it("modal không gọi API khi bắt đầu >= kết thúc", async () => {
    mock(m.promo.list).mockResolvedValue(page([]));
    render(<PromotionList />);
    await screen.findByText("Chưa có khuyến mại nào");
    fireEvent.click(screen.getByRole("button", { name: "Thêm khuyến mại" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Bắt đầu"), { target: { value: "2026-10-15T08:00" } });
    fireEvent.change(within(dialog).getByLabelText("Kết thúc"), { target: { value: "2026-10-15T08:00" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Tạo khuyến mại" }));
    expect(await within(dialog).findByText(/phải sau thời gian bắt đầu/)).toBeInTheDocument();
    expect(within(dialog).getByText("Vui lòng chọn ít nhất 1 sản phẩm")).toBeInTheDocument();
    expect(m.promo.create).not.toHaveBeenCalled();
  });
});

describe("người dùng", () => {
  const cust = (over = {}) => ({
    id: 7, fullName: "Nguyễn Văn A", phone: "0901234567", email: "a@b.co", role: "user", status: "active", createdAt: "2026-01-01T00:00:00Z",
    orderCount: 3, totalSpent: 9000000, lastOrderAt: null, addressCount: 1, reviewCount: 2, wishlistCount: 4,
    recentOrders: [{ code: "LG1", createdAt: "2026-10-01T00:00:00Z", status: "delivered", paymentStatus: "paid", total: 3000000, itemCount: 2 }], ...over,
  });

  it("quy tắc nút: không khóa/đổi quyền chính mình, không khóa admin, mở khóa luôn được", () => {
    expect(customerActions({ id: 1, role: "admin", status: "active" }, 1)).toMatchObject({ canLock: false, canChangeRole: false });
    expect(customerActions({ id: 2, role: "admin", status: "active" }, 1)).toMatchObject({ canLock: false, canChangeRole: true, nextRole: "user" });
    expect(customerActions({ id: 3, role: "user", status: "active" }, 1)).toMatchObject({ canLock: true, canChangeRole: true, nextRole: "admin" });
    expect(customerActions({ id: 3, role: "user", status: "locked" }, 1)).toMatchObject({ canLock: false, canUnlock: true });
    expect(customerActions({ id: 2, role: "admin", status: "locked" }, 1).canUnlock).toBe(true);
  });

  it("chi tiết: thống kê, 10 đơn, liên kết xem tất cả đơn", async () => {
    mock(m.customer.get).mockResolvedValue(cust());
    render(<CustomerDetail customerId={7} />);
    await screen.findByText("Nguyễn Văn A");
    expect(screen.getByRole("link", { name: "Xem tất cả đơn" })).toHaveAttribute("href", "/admin/orders?userId=7");
    expect(screen.getByRole("link", { name: "LG1" })).toBeInTheDocument();
  });

  it("khóa bằng swal có lý do; hủy swal thì không gọi API", async () => {
    mock(m.customer.get).mockResolvedValue(cust());
    mock(m.customer.setStatus).mockResolvedValue(cust({ status: "locked" }));
    render(<CustomerDetail customerId={7} />);
    await screen.findByText("Nguyễn Văn A");
    mock(m.confirmNote).mockResolvedValueOnce(null);
    fireEvent.click(screen.getByRole("button", { name: "Khóa tài khoản" }));
    await waitFor(() => expect(m.confirmNote).toHaveBeenCalledTimes(1));
    expect(m.customer.setStatus).not.toHaveBeenCalled();
    mock(m.confirmNote).mockResolvedValueOnce("Spam");
    fireEvent.click(screen.getByRole("button", { name: "Khóa tài khoản" }));
    await waitFor(() => expect(m.customer.setStatus).toHaveBeenCalledWith(7, "locked", "Spam"));
    expect(await screen.findByRole("button", { name: "Mở khóa tài khoản" })).toBeInTheDocument();
    expect(m.notify).toHaveBeenCalledWith("success", "Đã khóa tài khoản");
  });

  it("mở khóa gọi status active", async () => {
    mock(m.customer.get).mockResolvedValue(cust({ status: "locked" }));
    mock(m.customer.setStatus).mockResolvedValue(cust());
    render(<CustomerDetail customerId={7} />);
    await screen.findByText("Nguyễn Văn A");
    mock(m.confirmNote).mockResolvedValueOnce("");
    fireEvent.click(screen.getByRole("button", { name: "Mở khóa tài khoản" }));
    await waitFor(() => expect(m.customer.setStatus).toHaveBeenCalledWith(7, "active", undefined));
  });

  it("đổi quyền: swal cảnh báo nêu hệ quả, hủy không gọi API, xác nhận gọi setRole", async () => {
    mock(m.customer.get).mockResolvedValue(cust());
    mock(m.customer.setRole).mockResolvedValue(cust({ role: "admin" }));
    render(<CustomerDetail customerId={7} />);
    await screen.findByText("Nguyễn Văn A");
    mock(m.confirm).mockResolvedValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: "Cấp quyền quản trị" }));
    await waitFor(() => expect(m.confirm).toHaveBeenCalledTimes(1));
    expect(m.confirm.mock.calls[0][0]).toMatchObject({ tone: "danger" });
    expect(m.confirm.mock.calls[0][0].text).toMatch(/TOÀN QUYỀN/);
    expect(m.customer.setRole).not.toHaveBeenCalled();
    mock(m.confirm).mockResolvedValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Cấp quyền quản trị" }));
    await waitFor(() => expect(m.customer.setRole).toHaveBeenCalledWith(7, "admin"));
    expect(await screen.findByRole("button", { name: "Hạ quyền xuống người dùng" })).toBeInTheDocument();
  });

  it("chính mình: không có nút khóa, nút đổi quyền bị vô hiệu hóa; admin khác: không có nút khóa", async () => {
    m.selfId.value = 7;
    mock(m.customer.get).mockResolvedValue(cust({ role: "admin" }));
    render(<CustomerDetail customerId={7} />);
    await screen.findByText("Nguyễn Văn A");
    expect(screen.queryByRole("button", { name: "Khóa tài khoản" })).toBeNull();
    expect(screen.getByRole("button", { name: "Hạ quyền xuống người dùng" })).toBeDisabled();
    expect(screen.getByTestId("action-hint")).toHaveTextContent("Không thể tự");
    cleanup();
    m.selfId.value = 1;
    render(<CustomerDetail customerId={7} />);
    await screen.findByText("Nguyễn Văn A");
    expect(screen.queryByRole("button", { name: "Khóa tài khoản" })).toBeNull();
    expect(screen.getByRole("button", { name: "Hạ quyền xuống người dùng" })).toBeEnabled();
  });

  it.each([
    ["CANNOT_MODIFY_SELF", /tự khóa hoặc tự đổi quyền/],
    ["CANNOT_LOCK_ADMIN", /không thể khóa tài khoản quản trị/i],
    ["LAST_ADMIN", /quản trị viên cuối cùng/],
  ])("mã lỗi %s hiện toast rõ nghĩa", async (code, text) => {
    mock(m.customer.get).mockResolvedValue(cust({ role: "admin" }));
    mock(m.customer.setRole).mockRejectedValue(new ApiError(409, code, "raw"));
    render(<CustomerDetail customerId={7} />);
    await screen.findByText("Nguyễn Văn A");
    mock(m.confirm).mockResolvedValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Hạ quyền xuống người dùng" }));
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", expect.stringMatching(text)));
  });

  it("danh sách: lọc vai trò/trạng thái ghi lên URL; hiển thị số đơn và nhãn", async () => {
    mock(m.customer.list).mockResolvedValue({ items: [cust({ role: "admin", status: "locked" })], page: 1, pageSize: 20, total: 1, totalPages: 1 });
    render(<CustomerList />);
    await screen.findAllByText("Nguyễn Văn A");
    expect(screen.getAllByText("Quản trị viên").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Đã khóa").length).toBeGreaterThan(1);
    fireEvent.change(screen.getByLabelText("Vai trò"), { target: { value: "admin" } });
    expect(m.replace).toHaveBeenCalledWith("/admin/x?role=admin", { scroll: false });
    expect(buildCustomerSearch(parseCustomerFilters(new URLSearchParams("status=locked&role=zzz&page=2")))).toBe("?status=locked&page=2");
  });
});

describe("lọc đơn theo khách (userId)", () => {
  it("parse/build userId và gửi lên service", async () => {
    expect(parseOrderFilters(new URLSearchParams("userId=7")).userId).toBe("7");
    expect(parseOrderFilters(new URLSearchParams("userId=abc")).userId).toBe("");
    expect(buildOrderSearch(parseOrderFilters(new URLSearchParams("userId=7&page=2")))).toBe("?userId=7&page=2");
    m.search.value = "userId=7";
    mock(m.order.list).mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 });
    mock(m.customer.get).mockResolvedValue({ fullName: "Nguyễn Văn A" });
    render(<OrderList />);
    await waitFor(() => expect(m.order.list).toHaveBeenCalled());
    expect(m.order.list.mock.calls[0][0]).toMatchObject({ userId: 7 });
    expect(await screen.findByText("Đơn của Nguyễn Văn A")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bỏ lọc người dùng" }));
    expect(m.replace).toHaveBeenCalledWith("/admin/x", { scroll: false });
  });
});
