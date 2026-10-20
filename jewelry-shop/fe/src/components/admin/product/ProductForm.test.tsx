import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastHost } from "@/components/ui/ToastHost";
import { ApiError } from "@/utils/errors";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ replace, push: vi.fn() }) }));
vi.mock("@/services/admin-catalog.service", () => ({
  adminCategoryService: {
    list: vi.fn().mockResolvedValue([
      { id: 1, name: "Nhẫn", slug: "nhan", parentId: null, sortOrder: 0, isActive: true, productCount: 0, childCount: 0 },
    ]),
  },
  adminMaterialService: { list: vi.fn().mockResolvedValue([]) },
  adminGemstoneService: { list: vi.fn().mockResolvedValue([{ id: 3, name: "Kim cương", isActive: true, productCount: 0 }]) },
  adminCollectionService: { list: vi.fn().mockResolvedValue([]) },
}));
vi.mock("@/services/admin-product.service", () => ({
  adminProductService: { create: vi.fn(), update: vi.fn(), get: vi.fn(), changeStock: vi.fn() },
}));

import { adminProductService } from "@/services/admin-product.service";
import { ProductForm } from "./ProductForm";

const svc = adminProductService as unknown as Record<string, ReturnType<typeof vi.fn>>;
const label = (t: string) => screen.getByLabelText(t) as HTMLInputElement;

async function fillValid() {
  await screen.findByLabelText("Mã sản phẩm");
  fireEvent.change(label("Mã sản phẩm"), { target: { value: "LG-001" } });
  fireEvent.change(label("Tên sản phẩm"), { target: { value: "Nhẫn kim cương" } });
  fireEvent.change(label("Danh mục"), { target: { value: "1" } });
  fireEvent.change(label("Giá bán (₫)"), { target: { value: "1000000" } });
  fireEvent.change(label("SKU"), { target: { value: "LG-001-12" } });
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("ProductForm (tạo mới)", () => {
  it("không gọi API khi dữ liệu sai và hiện lỗi đúng ô", async () => {
    render(<><ProductForm /><ToastHost /></>);
    await screen.findByLabelText("Mã sản phẩm");
    fireEvent.click(screen.getByRole("button", { name: "Tạo sản phẩm" }));
    expect(await screen.findByText("Mã sản phẩm từ 2 đến 50 ký tự")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng chọn danh mục")).toBeInTheDocument();
    expect(svc.create).not.toHaveBeenCalled();
  });

  it("thêm/xóa dòng biến thể và đá quý; không cho trùng SKU", async () => {
    render(<><ProductForm /><ToastHost /></>);
    await fillValid();
    fireEvent.click(screen.getByRole("button", { name: "Thêm biến thể" }));
    expect(screen.getAllByLabelText("SKU")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Thêm đá quý" }));
    expect(screen.getByRole("group", { name: /Đá quý #1/ })).toBeInTheDocument();
    fireEvent.change(screen.getAllByLabelText("SKU")[1], { target: { value: "LG-001-12" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo sản phẩm" }));
    expect(await screen.findByText("SKU trùng với dòng trên")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xóa biến thể #2" }));
    expect(screen.getAllByLabelText("SKU")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Xóa đá quý #1" }));
    expect(screen.queryByRole("group", { name: /Đá quý #1/ })).toBeNull();
  });

  it("409 PRODUCT_CODE_ALREADY_EXISTS gắn vào ô Mã sản phẩm", async () => {
    svc.create.mockRejectedValue(new ApiError(409, "PRODUCT_CODE_ALREADY_EXISTS", "Mã sản phẩm đã tồn tại"));
    render(<><ProductForm /><ToastHost /></>);
    await fillValid();
    fireEvent.click(screen.getByRole("button", { name: "Tạo sản phẩm" }));
    await waitFor(() => expect(label("Mã sản phẩm")).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText("Mã sản phẩm đã tồn tại")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("409 SKU_ALREADY_EXISTS gắn vào đúng dòng biến thể", async () => {
    svc.create.mockRejectedValue(new ApiError(409, "SKU_ALREADY_EXISTS", "SKU LG-001-12 đã tồn tại"));
    render(<><ProductForm /><ToastHost /></>);
    await fillValid();
    fireEvent.click(screen.getByRole("button", { name: "Tạo sản phẩm" }));
    await waitFor(() => expect(label("SKU")).toHaveAttribute("aria-invalid", "true"));
  });

  it("gửi đúng payload (kèm tồn kho ban đầu) rồi chuyển sang trang sửa; chống submit đúp", async () => {
    let resolve!: (v: { id: number }) => void;
    svc.create.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<><ProductForm /><ToastHost /></>);
    await fillValid();
    fireEvent.change(label("Tồn kho ban đầu"), { target: { value: "5" } });
    const submit = screen.getByRole("button", { name: "Tạo sản phẩm" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    await waitFor(() => expect(svc.create).toHaveBeenCalledTimes(1));
    expect(svc.create.mock.calls[0][0]).toMatchObject({
      code: "LG-001",
      categoryId: 1,
      price: 1000000,
      variants: [{ sku: "LG-001-12", size: "", stock: 5, isActive: true }],
    });
    resolve({ id: 42 });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/products/42"));
  });
});

describe("ProductForm (sửa)", () => {
  const product = {
    id: 7,
    code: "LG-001",
    name: "Nhẫn",
    slug: "nhan",
    description: null,
    categoryId: 1,
    materialId: null,
    collectionId: null,
    targetGroup: "unisex",
    weight: null,
    costPrice: 0,
    price: 1000,
    warrantyInfo: null,
    certificate: null,
    isFeatured: false,
    isActive: true,
    images: [],
    gemstones: [],
    variants: [{ id: 11, sku: "A", size: "12", stock: 4, isActive: true }],
  };

  it("tồn kho biến thể đã lưu chỉ đổi qua nút Điều chỉnh tồn kho; INSUFFICIENT_STOCK hiện lỗi", async () => {
    svc.get.mockResolvedValue(product);
    render(<><ProductForm productId={7} /><ToastHost /></>);
    await screen.findByDisplayValue("LG-001");
    expect(screen.queryByLabelText("Tồn kho ban đầu")).toBeNull();
    expect(screen.getByTestId("stock-11")).toHaveTextContent("4");
    fireEvent.click(screen.getByRole("button", { name: "Điều chỉnh tồn kho A" }));
    const dialog = await screen.findByRole("dialog");
    svc.changeStock.mockRejectedValueOnce(new ApiError(409, "INSUFFICIENT_STOCK", "Không đủ tồn kho"));
    fireEvent.change(within(dialog).getByLabelText(/Số lượng thay đổi/), { target: { value: "-9" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cập nhật" }));
    expect(await screen.findByText(/Không đủ tồn kho/)).toBeInTheDocument();
    expect(svc.changeStock).toHaveBeenCalledWith(7, 11, { delta: -9 });
    svc.changeStock.mockResolvedValueOnce({ id: 11, sku: "A", size: "12", stock: 2 });
    fireEvent.change(within(dialog).getByLabelText(/Số lượng thay đổi/), { target: { value: "-2" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cập nhật" }));
    await waitFor(() => expect(screen.getByTestId("stock-11")).toHaveTextContent("2"));
  });

  it("PATCH không gửi stock của biến thể đã lưu và bỏ code/slug không đổi", async () => {
    svc.get.mockResolvedValue(product);
    svc.update.mockResolvedValue(product);
    render(<><ProductForm productId={7} /><ToastHost /></>);
    await screen.findByDisplayValue("LG-001");
    fireEvent.change(label("Tên sản phẩm"), { target: { value: "Nhẫn mới" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(svc.update).toHaveBeenCalled());
    const [id, body] = svc.update.mock.calls[0];
    expect(id).toBe(7);
    expect(body.code).toBeUndefined();
    expect(body.slug).toBeUndefined();
    expect(body.variants).toEqual([{ id: 11, sku: "A", size: "12", isActive: true }]);
  });
});
