import type { SortKey, TargetGroup } from "@/types/catalog";

export const TARGET_GROUPS: { value: TargetGroup; label: string }[] = [
  { value: "women", label: "Nữ" },
  { value: "men", label: "Nam" },
  { value: "unisex", label: "Unisex" },
  { value: "kids", label: "Trẻ em" },
];

/** Khoảng giá hiển thị ở bộ lọc; ánh xạ sang minPrice/maxPrice (maxPrice là cận trên bao gồm). */
export const PRICE_RANGES: { key: string; label: string; min?: number; max?: number }[] = [
  { key: "duoi-5tr", label: "Dưới 5 triệu", max: 4_999_999 },
  { key: "5-10tr", label: "5 - 10 triệu", min: 5_000_000, max: 9_999_999 },
  { key: "10-20tr", label: "10 - 20 triệu", min: 10_000_000, max: 19_999_999 },
  { key: "20-50tr", label: "20 - 50 triệu", min: 20_000_000, max: 49_999_999 },
  { key: "tren-50tr", label: "Trên 50 triệu", min: 50_000_000 },
];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "bestseller", label: "Bán chạy" },
  { value: "rating", label: "Được đánh giá cao" },
];

export const labelOf = <T extends { value: string; label: string }>(list: T[], value: string) =>
  list.find((i) => i.value === value)?.label ?? value;

/** Bảng quy đổi size nhẫn (hướng dẫn đo): chu vi ngón tay (mm) -> size. */
export const RING_SIZE_GUIDE: { size: string; circumference: number }[] = [
  { size: "8", circumference: 49 },
  { size: "10", circumference: 51 },
  { size: "12", circumference: 54 },
  { size: "14", circumference: 57 },
  { size: "16", circumference: 60 },
  { size: "18", circumference: 63 },
];
