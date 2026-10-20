import { TARGET_GROUPS, labelOf } from "@/constants/catalog";
import type { ProductDetail } from "@/types/catalog";

/** Các dòng bảng thông số; bỏ dòng không có dữ liệu. */
export function specRows(product: ProductDetail): [string, string][] {
  const rows: [string, string | null | undefined][] = [
    ["Mã sản phẩm", product.code],
    ["Loại", product.category.name],
    ["Chất liệu", product.material?.name],
    ["Bộ sưu tập", product.collection?.name],
    ["Trọng lượng", product.weight != null ? `${product.weight} g` : null],
    ["Dành cho", labelOf(TARGET_GROUPS, product.targetGroup)],
    ["Bảo hành", product.warrantyInfo],
    ["Giấy kiểm định", product.certificate],
  ];
  return rows.filter((r): r is [string, string] => !!r[1]);
}
