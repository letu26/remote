import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Field } from "@/components/ui/Field";
import type { CrudService } from "@/services/admin-catalog.service";
import { ToastHost } from "@/components/ui/ToastHost";
import { ApiError } from "@/utils/errors";
const confirmAction = vi.fn();
vi.mock("@/utils/confirm", () => ({ confirmAction: (...a: unknown[]) => confirmAction(...a) }));

import { CrudPage, type CrudConfig } from "./CrudPage";

interface Row {
  id: number;
  name: string;
  isActive: boolean;
}
interface Vals {
  name: string;
}
type In = { name: string; isActive?: boolean };

function setup(initial: Row[]) {
  const service: CrudService<Row, In> = {
    list: vi.fn().mockResolvedValue(initial),
    create: vi.fn().mockResolvedValue({ id: 99, name: "x", isActive: true }),
    update: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue(undefined),
  };
  const config: CrudConfig<Row, Vals, In> = {
    entity: "chất liệu",
    title: "Chất liệu",
    service,
    codeFields: { NAME_ALREADY_EXISTS: "name" },
    emptyValues: { name: "" },
    toValues: (r) => ({ name: r.name }),
    validate: (v): Record<string, string> => (v.name.trim().length < 2 ? { name: "Tên từ 2 ký tự" } : {}),
    toInput: (v) => ({ name: v.name.trim() }),
    columns: [{ header: "Tên", cell: (r) => r.name }],
    renderFields: ({ values, errors, set }) => (
      <Field label="Tên" name="name" value={values.name} error={errors.name} onChange={(e) => set("name", e.target.value)} />
    ),
  };
  render(<><CrudPage config={config} /><ToastHost /></>);
  return service;
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

const mock = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

describe("CrudPage", () => {
  it("hiện danh sách và trạng thái rỗng", async () => {
    setup([{ id: 1, name: "Vàng 18K", isActive: true }]);
    expect(await screen.findByText("Vàng 18K")).toBeInTheDocument();
    cleanup();
    setup([]);
    expect(await screen.findByText("Chưa có chất liệu nào")).toBeInTheDocument();
  });

  it("validate client rồi tạo mới và tải lại danh sách", async () => {
    const service = setup([]);
    await screen.findByText("Chưa có chất liệu nào");
    fireEvent.click(screen.getByRole("button", { name: "Thêm chất liệu" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Thêm chất liệu" }));
    expect(await within(dialog).findByText("Tên từ 2 ký tự")).toBeInTheDocument();
    expect(service.create).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText("Tên"), { target: { value: "Bạc 925" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Thêm chất liệu" }));
    await waitFor(() => expect(service.create).toHaveBeenCalledWith({ name: "Bạc 925" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(service.list).toHaveBeenCalledTimes(2);
  });

  it("lỗi 409 NAME_ALREADY_EXISTS gắn vào ô Tên, modal vẫn mở", async () => {
    const service = setup([]);
    mock(service.create).mockRejectedValue(new ApiError(409, "NAME_ALREADY_EXISTS", "Tên đã tồn tại"));
    await screen.findByText("Chưa có chất liệu nào");
    fireEvent.click(screen.getByRole("button", { name: "Thêm chất liệu" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Tên"), { target: { value: "Vàng" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Thêm chất liệu" }));
    await waitFor(() => expect(within(dialog).getByLabelText("Tên")).toHaveAttribute("aria-invalid", "true"));
    expect(within(dialog).getByText("Tên đã tồn tại")).toBeInTheDocument();
  });

  it("Esc đóng modal", async () => {
    setup([]);
    await screen.findByText("Chưa có chất liệu nào");
    fireEvent.click(screen.getByRole("button", { name: "Thêm chất liệu" }));
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("xóa: hộp xác nhận kiểu danger, RESOURCE_IN_USE báo toast và đề nghị ẩn", async () => {
    const service = setup([{ id: 5, name: "Vàng 18K", isActive: true }]);
    confirmAction.mockResolvedValue(true);
    service.remove = vi.fn().mockRejectedValue(new ApiError(409, "RESOURCE_IN_USE", "Đang được 3 sản phẩm sử dụng."));
    fireEvent.click(await screen.findByRole("button", { name: "Xóa Vàng 18K" }));
    expect(await screen.findByText(/Đang được 3 sản phẩm sử dụng/)).toBeInTheDocument();
    expect(confirmAction.mock.calls[0][0]).toMatchObject({ tone: "danger", confirmText: "Xóa" });
    expect(confirmAction.mock.calls[1][0].text).toMatch(/thay vì xóa/);
    await waitFor(() => expect(service.update).toHaveBeenCalledWith(5, { isActive: false }));
  });

  it("xóa: hủy xác nhận thì KHÔNG gọi API", async () => {
    const service = setup([{ id: 5, name: "Vàng 18K", isActive: true }]);
    confirmAction.mockResolvedValue(false);
    fireEvent.click(await screen.findByRole("button", { name: "Xóa Vàng 18K" }));
    await waitFor(() => expect(confirmAction).toHaveBeenCalledTimes(1));
    expect(service.remove).not.toHaveBeenCalled();
  });

  it("xóa thành công gọi service, tải lại và báo toast", async () => {
    const service = setup([{ id: 5, name: "Vàng 18K", isActive: true }]);
    confirmAction.mockResolvedValue(true);
    fireEvent.click(await screen.findByRole("button", { name: "Xóa Vàng 18K" }));
    await waitFor(() => expect(service.remove).toHaveBeenCalledWith(5));
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Đã xóa chất liệu")).toBeInTheDocument();
  });
});
