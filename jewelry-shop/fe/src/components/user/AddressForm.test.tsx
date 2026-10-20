import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Address } from "@/types/shop";
import { ApiError } from "@/utils/errors";

const m = vi.hoisted(() => ({
  provinces: vi.fn(),
  wards: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  setDefault: vi.fn(),
  remove: vi.fn(),
  notify: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock("@/services/location.service", () => ({
  locationService: { provinces: () => m.provinces(), wards: (...a: unknown[]) => m.wards(...a) },
}));
vi.mock("@/services/address.service", () => ({
  addressService: {
    list: () => m.list(),
    create: (...a: unknown[]) => m.create(...a),
    update: (...a: unknown[]) => m.update(...a),
    setDefault: (...a: unknown[]) => m.setDefault(...a),
    remove: (...a: unknown[]) => m.remove(...a),
  },
}));
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => m.notify(...a) }));
vi.mock("@/utils/confirm", () => ({ confirmAction: (...a: unknown[]) => m.confirm(...a) }));

import { AddressForm } from "./AddressForm";
import { AddressesView, MAX_ADDRESSES } from "./AddressesView";

const HN = { id: 1, code: "01", name: "Hà Nội" };
const HCM = { id: 2, code: "79", name: "Thành phố Hồ Chí Minh" };

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  m.provinces.mockResolvedValue([HN, HCM]);
  m.wards.mockImplementation(async (id: number) =>
    id === 1
      ? [{ id: 11, code: "a", name: "Phường Ba Đình" }, { id: 12, code: "b", name: "Phường Hoàn Kiếm" }]
      : [{ id: 21, code: "c", name: "Phường Bến Nghé" }],
  );
});
afterEach(cleanup);

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
async function pick(label: string, option: string) {
  fireEvent.focus(screen.getByLabelText(label));
  fireEvent.mouseDown(await screen.findByRole("option", { name: option }));
}
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Thêm địa chỉ", hidden: false }));

function fillBasics() {
  type("Họ tên người nhận", "Nguyễn Văn A");
  type("Số điện thoại", "0912345678");
  fireEvent.change(screen.getByLabelText(/Địa chỉ chi tiết/), { target: { value: "12 Nguyễn Trãi" } });
}

describe("AddressForm", () => {
  it("validate phía client: lỗi theo ô, không gọi API", async () => {
    render(<AddressForm editing={null} isFirst={false} onClose={vi.fn()} onSaved={vi.fn()} />);
    type("Số điện thoại", "123");
    submit();
    expect(await screen.findByText("Vui lòng nhập họ tên người nhận")).toBeInTheDocument();
    expect(screen.getByText(/10 số/)).toBeInTheDocument();
    expect(screen.getByText("Vui lòng chọn tỉnh/thành phố")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng chọn xã/phường")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập địa chỉ chi tiết")).toBeInTheDocument();
    expect(m.create).not.toHaveBeenCalled();
  });

  it("xã/phường bị khóa tới khi chọn tỉnh; chọn tỉnh tải xã/phường; đổi tỉnh xóa xã/phường đã chọn", async () => {
    render(<AddressForm editing={null} isFirst={false} onClose={vi.fn()} onSaved={vi.fn()} />);
    expect(screen.getByLabelText("Xã/Phường")).toBeDisabled();
    await pick("Tỉnh/Thành phố", "Hà Nội");
    await waitFor(() => expect(m.wards).toHaveBeenCalledWith(1, expect.anything()));
    await waitFor(() => expect(screen.getByLabelText("Xã/Phường")).toBeEnabled());
    await pick("Xã/Phường", "Phường Ba Đình");
    expect(screen.getByLabelText("Xã/Phường")).toHaveValue("Phường Ba Đình");
    await pick("Tỉnh/Thành phố", "Thành phố Hồ Chí Minh");
    await waitFor(() => expect(m.wards).toHaveBeenCalledWith(2, expect.anything()));
    expect(screen.getByLabelText("Xã/Phường")).toHaveValue("");
    await pick("Xã/Phường", "Phường Bến Nghé");
    expect(screen.queryByRole("option", { name: "Phường Ba Đình" })).toBeNull();
  });

  it("ô chọn có tìm kiếm theo gõ, không phân biệt dấu", async () => {
    render(<AddressForm editing={null} isFirst={false} onClose={vi.fn()} onSaved={vi.fn()} />);
    await pick("Tỉnh/Thành phố", "Hà Nội");
    await waitFor(() => expect(screen.getByLabelText("Xã/Phường")).toBeEnabled());
    fireEvent.focus(screen.getByLabelText("Xã/Phường"));
    fireEvent.change(screen.getByLabelText("Xã/Phường"), { target: { value: "hoan kiem" } });
    expect(await screen.findByRole("option", { name: "Phường Hoàn Kiếm" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Phường Ba Đình" })).toBeNull();
  });

  it("gửi đúng payload (id dạng số) và báo toast thành công", async () => {
    m.create.mockResolvedValue({});
    const onSaved = vi.fn();
    render(<AddressForm editing={null} isFirst onClose={vi.fn()} onSaved={onSaved} />);
    fillBasics();
    await pick("Tỉnh/Thành phố", "Hà Nội");
    await waitFor(() => expect(screen.getByLabelText("Xã/Phường")).toBeEnabled());
    await pick("Xã/Phường", "Phường Hoàn Kiếm");
    submit();
    await waitFor(() =>
      expect(m.create).toHaveBeenCalledWith({
        receiverName: "Nguyễn Văn A",
        receiverPhone: "0912345678",
        provinceId: 1,
        wardId: 12,
        detail: "12 Nguyễn Trãi",
        isDefault: true,
      }),
    );
    expect(m.notify).toHaveBeenCalledWith("success", "Đã thêm địa chỉ");
    expect(onSaved).toHaveBeenCalled();
  });

  it("INVALID_LOCATION gắn vào ô xã/phường theo details[].field", async () => {
    m.create.mockRejectedValue(
      new ApiError(400, "INVALID_LOCATION", "Xã/phường không thuộc tỉnh/thành", [
        { field: "wardId", message: "Xã/phường không thuộc tỉnh/thành đã chọn" },
      ]),
    );
    render(<AddressForm editing={null} isFirst={false} onClose={vi.fn()} onSaved={vi.fn()} />);
    fillBasics();
    await pick("Tỉnh/Thành phố", "Hà Nội");
    await waitFor(() => expect(screen.getByLabelText("Xã/Phường")).toBeEnabled());
    await pick("Xã/Phường", "Phường Ba Đình");
    submit();
    const msg = await screen.findByText("Xã/phường không thuộc tỉnh/thành đã chọn");
    expect(msg.id).toBe("wardId-error");
    expect(screen.getByLabelText("Xã/Phường")).toHaveAttribute("aria-invalid", "true");
  });

  it("lỗi ADDRESS_LIMIT_EXCEEDED từ server hiện qua toast", async () => {
    m.create.mockRejectedValue(new ApiError(400, "ADDRESS_LIMIT_EXCEEDED", "Tối đa 10 địa chỉ"));
    render(<AddressForm editing={null} isFirst={false} onClose={vi.fn()} onSaved={vi.fn()} />);
    fillBasics();
    await pick("Tỉnh/Thành phố", "Hà Nội");
    await waitFor(() => expect(screen.getByLabelText("Xã/Phường")).toBeEnabled());
    await pick("Xã/Phường", "Phường Ba Đình");
    submit();
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", "Tối đa 10 địa chỉ"));
  });
});

const addr = (id: number, over: Partial<Address> = {}): Address => ({
  id,
  receiverName: `Người ${id}`,
  receiverPhone: "0912345678",
  provinceId: 1,
  provinceName: "Hà Nội",
  wardId: 11,
  wardName: "Phường Ba Đình",
  detail: "12 Nguyễn Trãi",
  isDefault: id === 1,
  ...over,
});

describe("AddressesView", () => {
  it("đủ 10 địa chỉ: bấm Thêm chỉ báo toast, không mở modal", async () => {
    m.list.mockResolvedValue(Array.from({ length: MAX_ADDRESSES }, (_, i) => addr(i + 1)));
    render(<AddressesView />);
    await screen.findByText("Người 1");
    fireEvent.click(screen.getByRole("button", { name: "Thêm địa chỉ" }));
    expect(m.notify).toHaveBeenCalledWith("warning", expect.stringContaining("tối đa 10"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("hiện nhãn Mặc định đúng một địa chỉ", async () => {
    m.list.mockResolvedValue([addr(1), addr(2)]);
    render(<AddressesView />);
    await screen.findByText("Người 2");
    expect(screen.getAllByText("Mặc định")).toHaveLength(1);
  });
  it("xóa: hủy swal thì KHÔNG gọi API; xác nhận thì gọi và tải lại", async () => {
    m.list.mockResolvedValue([addr(1), addr(2)]);
    m.remove.mockResolvedValue(undefined);
    render(<AddressesView />);
    await screen.findByText("Người 2");
    m.confirm.mockResolvedValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: "Xóa địa chỉ Người 2" }));
    await waitFor(() => expect(m.confirm).toHaveBeenCalledTimes(1));
    expect(m.confirm.mock.calls[0][0]).toMatchObject({ tone: "danger" });
    expect(m.remove).not.toHaveBeenCalled();
    m.confirm.mockResolvedValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Xóa địa chỉ Người 2" }));
    await waitFor(() => expect(m.remove).toHaveBeenCalledWith(2));
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("success", "Đã xóa địa chỉ"));
    await waitFor(() => expect(m.list).toHaveBeenCalledTimes(2));
  });
  it("đặt mặc định gọi API rồi báo toast", async () => {
    m.list.mockResolvedValue([addr(1), addr(2)]);
    m.setDefault.mockResolvedValue(addr(2));
    render(<AddressesView />);
    await screen.findByText("Người 2");
    fireEvent.click(screen.getByRole("button", { name: "Đặt địa chỉ Người 2 làm mặc định" }));
    await waitFor(() => expect(m.setDefault).toHaveBeenCalledWith(2));
    expect(m.notify).toHaveBeenCalledWith("success", "Đã đặt làm địa chỉ mặc định");
  });
  it("danh sách rỗng: empty state", async () => {
    m.list.mockResolvedValue([]);
    render(<AddressesView />);
    expect(await screen.findByText("Bạn chưa có địa chỉ nào")).toBeInTheDocument();
  });
});
