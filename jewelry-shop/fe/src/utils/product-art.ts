import type { ArtSpec, GemSlug, MetalSlug } from "@/types/catalog";

const plain = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();

/** Chọn kiểu ảnh minh họa theo slug/tên danh mục (khi sản phẩm chưa có ảnh thật). */
export function artFor(categorySlug?: string | null, gemName?: string | null): ArtSpec {
  const c = plain(categorySlug ?? "");
  let kind: ArtSpec["kind"] = "ring";
  if (c.includes("day-chuyen") || c.includes("mat-day")) kind = "necklace";
  else if (c.includes("bong-tai")) kind = "earring";
  else if (c.includes("lac") || c.includes("vong")) kind = "bracelet";
  else if (c.includes("da-quy") || c.includes("vien-da")) kind = "gemstone";
  const g = plain(gemName ?? "");
  let gem: GemSlug | "none" = "none";
  if (g.includes("kim cuong")) gem = "kim-cuong";
  else if (g.includes("ruby")) gem = "ruby";
  else if (g.includes("sapphire")) gem = "sapphire";
  else if (g.includes("ngoc trai")) gem = "ngoc-trai";
  else if (kind === "gemstone") gem = "kim-cuong";
  return { kind, gem };
}

export function metalFor(materialName?: string | null): MetalSlug {
  const m = plain(materialName ?? "");
  if (m.includes("vang trang")) return "vang-trang";
  if (m.includes("vang hong")) return "vang-hong";
  if (m.includes("bach kim")) return "bach-kim";
  if (m.includes("bac")) return "bac";
  return "vang";
}
