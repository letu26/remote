import type {
  AdminProduct,
  ProductGemstoneInput,
  ProductInput,
  ProductVariantInput,
  TargetGroup,
} from "@/types/admin-catalog";
import type { FormErrors } from "@/utils/validators";
import { SLUG_REGEX } from "../catalog-configs";

export const TARGET_GROUP_OPTIONS: { value: TargetGroup; label: string }[] = [
  { value: "unisex", label: "Unisex" },
  { value: "women", label: "Nữ" },
  { value: "men", label: "Nam" },
  { value: "kids", label: "Trẻ em" },
];

export interface GemRow {
  key: string;
  gemstoneId: string;
  quantity: string;
  carat: string;
  color: string;
  clarity: string;
  cut: string;
}
export interface VariantRow {
  key: string;
  /** Có id = biến thể đã lưu trên server (tồn kho chỉ đổi qua nút Điều chỉnh tồn kho). */
  id?: number;
  sku: string;
  size: string;
  stock: string;
  isActive: boolean;
}
export interface ProductFormValues {
  code: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  materialId: string;
  collectionId: string;
  targetGroup: TargetGroup;
  costPrice: string;
  price: string;
  weight: string;
  warrantyInfo: string;
  certificate: string;
  gemstones: GemRow[];
  variants: VariantRow[];
}

let seq = 0;
export const newKey = () => `row-${++seq}`;

export const emptyGemRow = (): GemRow => ({
  key: newKey(),
  gemstoneId: "",
  quantity: "1",
  carat: "",
  color: "",
  clarity: "",
  cut: "",
});
export const emptyVariantRow = (): VariantRow => ({ key: newKey(), sku: "", size: "", stock: "0", isActive: true });

export function emptyProductForm(): ProductFormValues {
  return {
    code: "",
    name: "",
    slug: "",
    description: "",
    isActive: true,
    isFeatured: false,
    categoryId: "",
    materialId: "",
    collectionId: "",
    targetGroup: "unisex",
    costPrice: "0",
    price: "",
    weight: "",
    warrantyInfo: "",
    certificate: "",
    gemstones: [],
    variants: [emptyVariantRow()],
  };
}

const str = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function productToForm(p: AdminProduct): ProductFormValues {
  return {
    code: p.code,
    name: p.name,
    slug: p.slug,
    description: str(p.description),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    categoryId: str(p.categoryId),
    materialId: str(p.materialId),
    collectionId: str(p.collectionId),
    targetGroup: p.targetGroup,
    costPrice: str(p.costPrice),
    price: str(p.price),
    weight: str(p.weight),
    warrantyInfo: str(p.warrantyInfo),
    certificate: str(p.certificate),
    gemstones: p.gemstones.map((g) => ({
      key: newKey(),
      gemstoneId: str(g.gemstoneId),
      quantity: str(g.quantity),
      carat: str(g.carat),
      color: str(g.color),
      clarity: str(g.clarity),
      cut: str(g.cut),
    })),
    variants: p.variants.map((v) => ({
      key: newKey(),
      id: v.id,
      sku: v.sku,
      size: v.size,
      stock: String(v.stock),
      isActive: v.isActive,
    })),
  };
}

// ---------- Cập nhật danh sách động (bất biến) ----------

export function updateRow<T extends { key: string }>(rows: T[], key: string, patch: Partial<T>): T[] {
  return rows.map((r) => (r.key === key ? { ...r, ...patch } : r));
}
export function removeRow<T extends { key: string }>(rows: T[], key: string): T[] {
  return rows.filter((r) => r.key !== key);
}

// ---------- Validate ----------

const INT = /^\d+$/;
const DECIMAL = /^\d+(\.\d{1,3})?$/;
const DECIMAL_ANY = /^\d+(\.\d+)?$/;

export function validateProductForm(v: ProductFormValues, mode: "create" | "edit"): FormErrors {
  const e: FormErrors = {};
  const code = v.code.trim();
  if (code.length < 2 || code.length > 50) e.code = "Mã sản phẩm từ 2 đến 50 ký tự";
  const name = v.name.trim();
  if (name.length < 2 || name.length > 200) e.name = "Tên sản phẩm từ 2 đến 200 ký tự";
  if (v.slug.trim() && !SLUG_REGEX.test(v.slug.trim())) e.slug = "Slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang";
  if (!v.categoryId) e.categoryId = "Vui lòng chọn danh mục";

  if (!INT.test(v.price.trim()) || Number(v.price) <= 0) e.price = "Giá bán phải là số nguyên lớn hơn 0";
  if (!INT.test(v.costPrice.trim())) e.costPrice = "Giá nhập phải là số nguyên từ 0 trở lên";
  if (v.weight.trim() && (!DECIMAL.test(v.weight.trim()) || Number(v.weight) <= 0))
    e.weight = "Trọng lượng là số dương, tối đa 3 chữ số thập phân";

  if (v.variants.length === 0) e.variants = "Cần ít nhất 1 biến thể";
  const skus = new Map<string, number>();
  const sizes = new Map<string, number>();
  v.variants.forEach((row, i) => {
    const sku = row.sku.trim();
    if (!sku) e[`variants.${i}.sku`] = "Nhập SKU";
    else if (sku.length > 100) e[`variants.${i}.sku`] = "SKU tối đa 100 ký tự";
    else if (skus.has(sku.toLowerCase())) e[`variants.${i}.sku`] = "SKU trùng với dòng trên";
    else skus.set(sku.toLowerCase(), i);

    const size = row.size.trim().toLowerCase();
    if (sizes.has(size)) e[`variants.${i}.size`] = "Size trùng với dòng trên";
    else sizes.set(size, i);

    if (!row.id || mode === "create") {
      if (!INT.test(row.stock.trim())) e[`variants.${i}.stock`] = "Tồn kho là số nguyên từ 0";
    }
  });

  v.gemstones.forEach((g, i) => {
    if (!g.gemstoneId) e[`gemstones.${i}.gemstoneId`] = "Chọn loại đá";
    if (!INT.test(g.quantity.trim()) || Number(g.quantity) < 1) e[`gemstones.${i}.quantity`] = "Số lượng từ 1";
    if (g.carat.trim() && (!DECIMAL_ANY.test(g.carat.trim()) || Number(g.carat) <= 0)) e[`gemstones.${i}.carat`] = "Carat là số dương";
  });
  return e;
}

// ---------- Chuyển thành payload ----------

export function toProductInput(v: ProductFormValues, mode: "create" | "edit"): ProductInput {
  const gemstones: ProductGemstoneInput[] = v.gemstones.map((g) => ({
    gemstoneId: Number(g.gemstoneId),
    quantity: Number(g.quantity),
    ...(g.carat.trim() ? { carat: Number(g.carat) } : {}),
    ...(g.color.trim() ? { color: g.color.trim() } : {}),
    ...(g.clarity.trim() ? { clarity: g.clarity.trim() } : {}),
    ...(g.cut.trim() ? { cut: g.cut.trim() } : {}),
  }));
  const variants: ProductVariantInput[] = v.variants.map((r) => ({
    ...(mode === "edit" && r.id ? { id: r.id } : {}),
    sku: r.sku.trim(),
    size: r.size.trim(),
    // Biến thể đã có: không gửi stock (đổi qua endpoint /stock).
    ...(mode === "create" || !r.id ? { stock: Number(r.stock) } : {}),
    isActive: r.isActive,
  }));
  return {
    code: v.code.trim(),
    name: v.name.trim(),
    ...(v.slug.trim() ? { slug: v.slug.trim() } : {}),
    description: v.description.trim(),
    categoryId: Number(v.categoryId),
    materialId: v.materialId ? Number(v.materialId) : null,
    collectionId: v.collectionId ? Number(v.collectionId) : null,
    targetGroup: v.targetGroup,
    ...(v.weight.trim() ? { weight: Number(v.weight) } : {}),
    costPrice: Number(v.costPrice),
    price: Number(v.price),
    warrantyInfo: v.warrantyInfo.trim(),
    certificate: v.certificate.trim(),
    isFeatured: v.isFeatured,
    isActive: v.isActive,
    gemstones,
    variants,
  };
}

/** So sánh nội dung form (bỏ qua key nội bộ) để biết có thay đổi chưa lưu. */
export function formSnapshot(v: ProductFormValues): string {
  const strip = <T extends { key: string }>(row: T) => {
    const copy: Record<string, unknown> = { ...row };
    delete copy.key;
    return copy;
  };
  return JSON.stringify({
    ...v,
    gemstones: v.gemstones.map(strip),
    // Tồn kho biến thể đã lưu đổi qua endpoint riêng nên không tính là chỉnh sửa form.
    variants: v.variants.map((r) => ({ ...strip(r), ...(r.id ? { stock: "" } : {}) })),
  });
}

// ---------- Lỗi từ server ----------

/**
 * Gắn lỗi 409 SKU_ALREADY_EXISTS vào đúng dòng biến thể: tìm SKU nằm trong message;
 * không tìm được thì gắn vào ô chung `variants`.
 */
export function resolveSkuConflict(
  values: ProductFormValues,
  error: { code: string; message: string },
): { field: string; message: string } | null {
  if (error.code !== "SKU_ALREADY_EXISTS") return null;
  const msg = error.message.toLowerCase();
  const idx = values.variants.findIndex((r) => r.sku.trim() && msg.includes(r.sku.trim().toLowerCase()));
  return { field: idx >= 0 ? `variants.${idx}.sku` : "variants", message: error.message };
}
