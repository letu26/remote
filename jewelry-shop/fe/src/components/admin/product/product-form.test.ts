import { describe, expect, it } from "vitest";
import type { AdminProduct } from "@/types/admin-catalog";
import { ApiError } from "@/utils/errors";
import { toAdminFormError } from "../admin-errors";
import { checkImageFiles, chunk, moveItem } from "./image-validation";
import {
  emptyGemRow,
  emptyProductForm,
  emptyVariantRow,
  formSnapshot,
  productToForm,
  removeRow,
  resolveSkuConflict,
  toProductInput,
  updateRow,
  validateProductForm,
  type ProductFormValues,
} from "./product-form";

function valid(): ProductFormValues {
  const f = emptyProductForm();
  return {
    ...f,
    code: "LG-001",
    name: "Nhẫn kim cương",
    categoryId: "1",
    price: "1000000",
    variants: [{ ...f.variants[0], sku: "LG-001-12", size: "12", stock: "5" }],
  };
}

describe("validateProductForm", () => {
  it("form hợp lệ không có lỗi", () => {
    expect(validateProductForm(valid(), "create")).toEqual({});
  });
  it("mã 2..50, giá bán > 0, giá nhập >= 0, danh mục bắt buộc", () => {
    const e = validateProductForm({ ...valid(), code: "A", price: "0", costPrice: "-1", categoryId: "" }, "create");
    expect(e).toMatchObject({
      code: expect.any(String),
      price: expect.any(String),
      costPrice: expect.any(String),
      categoryId: expect.any(String),
    });
    expect(validateProductForm({ ...valid(), code: "x".repeat(51) }, "create").code).toBeTruthy();
  });
  it("tiền phải là số nguyên", () => {
    expect(validateProductForm({ ...valid(), price: "1000.5" }, "create").price).toBeTruthy();
    expect(validateProductForm({ ...valid(), costPrice: "abc" }, "create").costPrice).toBeTruthy();
  });
  it("cần ít nhất 1 biến thể", () => {
    expect(validateProductForm({ ...valid(), variants: [] }, "create").variants).toBeTruthy();
  });
  it("SKU và size không được trùng trong form", () => {
    const v = valid();
    const e = validateProductForm(
      { ...v, variants: [v.variants[0], { ...emptyVariantRow(), sku: "lg-001-12", size: "12 ", stock: "1" }] },
      "create",
    );
    expect(e["variants.1.sku"]).toBeTruthy();
    expect(e["variants.1.size"]).toBeTruthy();
    expect(e["variants.0.sku"]).toBeUndefined();
  });
  it("tồn kho ban đầu phải là số nguyên >= 0", () => {
    const v = valid();
    expect(validateProductForm({ ...v, variants: [{ ...v.variants[0], stock: "-1" }] }, "create")["variants.0.stock"]).toBeTruthy();
    expect(validateProductForm({ ...v, variants: [{ ...v.variants[0], stock: "1.5" }] }, "create")["variants.0.stock"]).toBeTruthy();
  });
  it("đá quý: bắt buộc loại đá, số lượng >= 1, carat dương", () => {
    const g = { ...emptyGemRow(), quantity: "0", carat: "-2" };
    const e = validateProductForm({ ...valid(), gemstones: [g] }, "create");
    expect(e["gemstones.0.gemstoneId"]).toBeTruthy();
    expect(e["gemstones.0.quantity"]).toBeTruthy();
    expect(e["gemstones.0.carat"]).toBeTruthy();
  });
  it("khi sửa, biến thể đã lưu không bị kiểm tra tồn kho", () => {
    const v = valid();
    const saved = { ...v, variants: [{ ...v.variants[0], id: 9, stock: "" }] };
    expect(validateProductForm(saved, "edit")).toEqual({});
  });
});

describe("danh sách động biến thể / đá quý", () => {
  it("thêm, sửa, xóa dòng theo key và giữ nguyên dòng khác", () => {
    const a = emptyVariantRow();
    const b = emptyVariantRow();
    let rows = [a, b];
    rows = updateRow(rows, a.key, { sku: "S1" });
    expect(rows.map((r) => r.sku)).toEqual(["S1", ""]);
    rows = removeRow(rows, a.key);
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe(b.key);
    expect(a.key).not.toBe(b.key);
  });
});

describe("toProductInput", () => {
  const server: AdminProduct = {
    id: 1,
    code: "LG-001",
    name: "N",
    slug: "n",
    description: null,
    categoryId: 2,
    materialId: null,
    collectionId: null,
    targetGroup: "women",
    weight: 3.2,
    costPrice: 0,
    price: 100,
    warrantyInfo: null,
    certificate: null,
    isFeatured: false,
    isActive: true,
    images: [],
    gemstones: [{ gemstoneId: 3, quantity: 1, carat: 0.5, color: "D", clarity: null, cut: null }],
    variants: [{ id: 7, sku: "A", size: "12", stock: 4, isActive: true }],
  };
  it("tạo mới gửi tồn kho, không gửi id", () => {
    const body = toProductInput(valid(), "create");
    expect(body.variants[0]).toEqual({ sku: "LG-001-12", size: "12", stock: 5, isActive: true });
    expect(body.materialId).toBeNull();
  });
  it("sửa: biến thể đã lưu gửi id và KHÔNG gửi stock; biến thể mới gửi stock", () => {
    const form = productToForm(server);
    form.variants.push({ ...emptyVariantRow(), sku: "B", size: "13", stock: "2" });
    const body = toProductInput(form, "edit");
    expect(body.variants[0]).toEqual({ id: 7, sku: "A", size: "12", isActive: true });
    expect(body.variants[1]).toEqual({ sku: "B", size: "13", stock: 2, isActive: true });
    expect(body.gemstones[0]).toEqual({ gemstoneId: 3, quantity: 1, carat: 0.5, color: "D" });
  });
  it("snapshot bỏ qua key nội bộ và tồn kho của biến thể đã lưu", () => {
    const a = productToForm(server);
    const b = productToForm(server);
    b.variants[0].stock = "99";
    expect(formSnapshot(a)).toBe(formSnapshot(b));
    b.variants[0].sku = "Z";
    expect(formSnapshot(a)).not.toBe(formSnapshot(b));
  });
});

describe("lỗi 409 / details từ server", () => {
  it("details[].field gắn đúng ô, kể cả dạng variants[0].sku", () => {
    const err = new ApiError(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", [
      { field: "price", message: "Giá phải > 0" },
      { field: "variants[1].sku", message: "SKU quá dài" },
    ]);
    const { fields, message } = toAdminFormError(err);
    expect(fields).toEqual({ price: "Giá phải > 0", "variants.1.sku": "SKU quá dài" });
    expect(message).toBe("");
  });
  it("PRODUCT_CODE_ALREADY_EXISTS -> ô code, SLUG_ALREADY_EXISTS -> ô slug", () => {
    const map = { PRODUCT_CODE_ALREADY_EXISTS: "code", SLUG_ALREADY_EXISTS: "slug" };
    expect(toAdminFormError(new ApiError(409, "PRODUCT_CODE_ALREADY_EXISTS", "Mã đã tồn tại"), map).fields).toEqual({ code: "Mã đã tồn tại" });
    expect(toAdminFormError(new ApiError(409, "SLUG_ALREADY_EXISTS", "Slug đã tồn tại"), map).fields).toEqual({ slug: "Slug đã tồn tại" });
  });
  it("SKU_ALREADY_EXISTS gắn vào dòng có SKU nêu trong message, không thấy thì gắn ô chung", () => {
    const v = valid();
    const form = { ...v, variants: [v.variants[0], { ...emptyVariantRow(), sku: "LG-001-13", size: "13" }] };
    expect(resolveSkuConflict(form, { code: "SKU_ALREADY_EXISTS", message: "SKU LG-001-13 đã tồn tại" })?.field).toBe("variants.1.sku");
    expect(resolveSkuConflict(form, { code: "SKU_ALREADY_EXISTS", message: "SKU đã tồn tại" })?.field).toBe("variants");
    expect(resolveSkuConflict(form, { code: "OTHER", message: "x" })).toBeNull();
  });
  it("mã lỗi upload hiện thông báo thân thiện", () => {
    const { message } = toAdminFormError(new ApiError(503, "UPLOAD_NOT_CONFIGURED", "raw"));
    expect(message).toMatch(/Chưa cấu hình lưu trữ ảnh/);
  });
});

describe("checkImageFiles", () => {
  const file = (name: string, type: string, size = 1000) => new File([new Uint8Array(size)], name, { type });
  it("nhận jpg/png/webp hợp lệ", () => {
    const r = checkImageFiles([file("a.jpg", "image/jpeg"), file("b.png", "image/png"), file("c.webp", "image/webp")], 0);
    expect(r.valid).toHaveLength(3);
    expect(r.errors).toEqual([]);
  });
  it("loại file sai định dạng và quá 5MB", () => {
    const r = checkImageFiles(
      [file("a.gif", "image/gif"), file("big.jpg", "image/jpeg", 5 * 1024 * 1024 + 1), file("ok.jpg", "image/jpeg")],
      0,
    );
    expect(r.valid.map((f) => f.name)).toEqual(["ok.jpg"]);
    expect(r.errors).toHaveLength(2);
  });
  it("tối đa 10 ảnh mỗi sản phẩm", () => {
    const files = Array.from({ length: 5 }, (_, i) => file(`${i}.jpg`, "image/jpeg"));
    const r = checkImageFiles(files, 8);
    expect(r.valid).toHaveLength(2);
    expect(r.errors.join(" ")).toMatch(/tối đa 10 ảnh/);
    expect(checkImageFiles(files, 10).valid).toHaveLength(0);
  });
  it("chunk và moveItem", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(moveItem([1, 2, 3], 1, -1)).toEqual([2, 1, 3]);
    expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
  });
});
