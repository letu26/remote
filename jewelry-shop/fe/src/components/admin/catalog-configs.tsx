import { Checkbox } from "@/components/ui/Checkbox";
import { Field, inputClass } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import {
  adminCategoryService,
  adminCollectionService,
  adminGemstoneService,
  adminMaterialService,
} from "@/services/admin-catalog.service";
import type {
  AdminCategory,
  AdminCollection,
  AdminNamedItem,
  CategoryInput,
  CollectionInput,
  NamedInput,
} from "@/types/admin-catalog";
import type { FormErrors } from "@/utils/validators";
import { NAME_CODE_FIELD, SLUG_CODE_FIELD } from "./admin-errors";
import type { CrudConfig } from "./CrudPage";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateName(name: string, label = "Tên"): string | undefined {
  const t = name.trim();
  if (t.length < 2 || t.length > 100) return `${label} từ 2 đến 100 ký tự`;
}
export function validateSlug(slug: string): string | undefined {
  if (slug.trim() && !SLUG_REGEX.test(slug.trim())) return "Slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang";
}

const SLUG_HINT = "Để trống để tự sinh từ tên";

// ---------- Danh mục ----------
export interface CategoryValues {
  name: string;
  slug: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}
type CategoryRow = AdminCategory & { depth?: number };

/** Id của danh mục và toàn bộ hậu duệ (để không cho chọn làm danh mục cha). */
export function descendantIds(rows: AdminCategory[], id: number): Set<number> {
  const out = new Set<number>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const r of rows) {
      if (r.parentId !== null && out.has(r.parentId) && !out.has(r.id)) {
        out.add(r.id);
        grew = true;
      }
    }
  }
  return out;
}

/** Xếp danh mục dạng cây (cha trước, con ngay sau), kèm độ sâu để thụt lề. */
export function arrangeCategoryTree(rows: AdminCategory[]): CategoryRow[] {
  const ids = new Set(rows.map((r) => r.id));
  const byParent = new Map<number | null, AdminCategory[]>();
  for (const r of rows) {
    const key = r.parentId !== null && ids.has(r.parentId) ? r.parentId : null;
    byParent.set(key, [...(byParent.get(key) ?? []), r]);
  }
  const out: CategoryRow[] = [];
  const walk = (parent: number | null, depth: number) => {
    const list = (byParent.get(parent) ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi"));
    for (const r of list) {
      out.push({ ...r, depth });
      walk(r.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export function validateCategory(v: CategoryValues): FormErrors {
  const e: FormErrors = {};
  const name = validateName(v.name, "Tên danh mục");
  if (name) e.name = name;
  const slug = validateSlug(v.slug);
  if (slug) e.slug = slug;
  if (v.sortOrder.trim() && !/^-?\d+$/.test(v.sortOrder.trim())) e.sortOrder = "Thứ tự phải là số nguyên";
  return e;
}

export const categoryConfig: CrudConfig<CategoryRow, CategoryValues, CategoryInput> = {
  entity: "danh mục",
  title: "Danh sách danh mục",
  service: adminCategoryService,
  arrange: (rows) => arrangeCategoryTree(rows),
  codeFields: SLUG_CODE_FIELD,
  emptyValues: { name: "", slug: "", parentId: "", sortOrder: "0", isActive: true },
  toValues: (r) => ({
    name: r.name,
    slug: r.slug,
    parentId: r.parentId === null ? "" : String(r.parentId),
    sortOrder: String(r.sortOrder),
    isActive: r.isActive,
  }),
  validate: validateCategory,
  toInput: (v, editing) => ({
    name: v.name.trim(),
    // Khi sửa, slug rỗng nghĩa là giữ nguyên: không gửi.
    ...(v.slug.trim() ? { slug: v.slug.trim() } : {}),
    parentId: v.parentId ? Number(v.parentId) : editing ? null : undefined,
    sortOrder: v.sortOrder.trim() ? Number(v.sortOrder) : 0,
    isActive: v.isActive,
  }),
  columns: [
    {
      header: "Tên",
      cell: (r) => (
        <span className="font-medium text-ink" style={{ paddingLeft: `${(r.depth ?? 0) * 1.25}rem` }}>
          {(r.depth ?? 0) > 0 && <span aria-hidden className="mr-1 text-muted">└</span>}
          {r.name}
        </span>
      ),
    },
    { header: "Slug", cell: (r) => <code className="text-xs text-muted">{r.slug}</code> },
    {
      header: "Danh mục cha",
      cell: (r, rows) => rows.find((p) => p.id === r.parentId)?.name ?? <span className="text-muted">-</span>,
    },
    { header: "Thứ tự", cell: (r) => r.sortOrder },
    { header: "Sản phẩm", cell: (r) => r.productCount },
    { header: "Con", cell: (r) => r.childCount },
  ],
  renderFields: ({ values, errors, set, rows, editing }) => {
    const blocked = editing ? descendantIds(rows, editing.id) : new Set<number>();
    const parentOptions = [
      { value: "", label: "Không có (danh mục gốc)" },
      ...arrangeCategoryTree(rows)
        .filter((r) => !blocked.has(r.id))
        .map((r) => ({ value: String(r.id), label: `${"— ".repeat(r.depth ?? 0)}${r.name}` })),
    ];
    return (
      <>
        <Field label="Tên danh mục" name="name" value={values.name} error={errors.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />
        <Field label="Slug" name="slug" value={values.slug} error={errors.slug} placeholder={SLUG_HINT} onChange={(e) => set("slug", e.target.value)} />
        <Select label="Danh mục cha" name="parentId" value={values.parentId} options={parentOptions} onChange={(e) => set("parentId", e.target.value)} />
        {errors.parentId && <p role="alert" className="text-xs text-danger">{errors.parentId}</p>}
        <Field label="Thứ tự hiển thị" name="sortOrder" inputMode="numeric" value={values.sortOrder} error={errors.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
        <Checkbox label="Hiển thị trên cửa hàng" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
      </>
    );
  },
};

// ---------- Chất liệu / loại đá ----------
export interface NamedValues {
  name: string;
  isActive: boolean;
}

function namedConfig(
  entity: string,
  title: string,
  service: CrudConfig<AdminNamedItem, NamedValues, NamedInput>["service"],
): CrudConfig<AdminNamedItem, NamedValues, NamedInput> {
  return {
    entity,
    title,
    service,
    codeFields: NAME_CODE_FIELD,
    emptyValues: { name: "", isActive: true },
    toValues: (r) => ({ name: r.name, isActive: r.isActive }),
    validate: (v): FormErrors => {
      const name = validateName(v.name, `Tên ${entity}`);
      return name ? { name } : {};
    },
    toInput: (v) => ({ name: v.name.trim(), isActive: v.isActive }),
    columns: [
      { header: "Tên", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
      { header: "Sản phẩm", cell: (r) => r.productCount },
    ],
    renderFields: ({ values, errors, set }) => (
      <>
        <Field label={`Tên ${entity}`} name="name" value={values.name} error={errors.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />
        <Checkbox label="Hiển thị trong bộ lọc" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
      </>
    ),
  };
}

export const materialConfig = namedConfig("chất liệu", "Danh sách chất liệu", adminMaterialService);
export const gemstoneConfig = namedConfig("loại đá", "Danh sách loại đá", adminGemstoneService);

// ---------- Bộ sưu tập ----------
export interface CollectionValues {
  name: string;
  slug: string;
  description: string;
  bannerUrl: string;
  isActive: boolean;
}

export function validateCollection(v: CollectionValues): FormErrors {
  const e: FormErrors = {};
  const name = validateName(v.name, "Tên bộ sưu tập");
  if (name) e.name = name;
  const slug = validateSlug(v.slug);
  if (slug) e.slug = slug;
  const url = v.bannerUrl.trim();
  if (url && !/^https?:\/\/\S+$/i.test(url)) e.bannerUrl = "Banner phải là đường dẫn bắt đầu bằng http:// hoặc https://";
  return e;
}

export const collectionConfig: CrudConfig<AdminCollection, CollectionValues, CollectionInput> = {
  entity: "bộ sưu tập",
  title: "Danh sách bộ sưu tập",
  service: adminCollectionService,
  codeFields: SLUG_CODE_FIELD,
  emptyValues: { name: "", slug: "", description: "", bannerUrl: "", isActive: true },
  toValues: (r) => ({
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
    bannerUrl: r.bannerUrl ?? "",
    isActive: r.isActive,
  }),
  validate: validateCollection,
  toInput: (v) => ({
    name: v.name.trim(),
    ...(v.slug.trim() ? { slug: v.slug.trim() } : {}),
    description: v.description.trim(),
    bannerUrl: v.bannerUrl.trim(),
    isActive: v.isActive,
  }),
  columns: [
    { header: "Tên", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { header: "Slug", cell: (r) => <code className="text-xs text-muted">{r.slug}</code> },
    {
      header: "Mô tả",
      cell: (r) => <span className="line-clamp-2 max-w-xs text-muted">{r.description || "-"}</span>,
    },
    { header: "Sản phẩm", cell: (r) => r.productCount ?? "-" },
  ],
  renderFields: ({ values, errors, set }) => (
    <>
      <Field label="Tên bộ sưu tập" name="name" value={values.name} error={errors.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />
      <Field label="Slug" name="slug" value={values.slug} error={errors.slug} placeholder={SLUG_HINT} onChange={(e) => set("slug", e.target.value)} />
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-ink">Mô tả</label>
        <textarea id="description" name="description" rows={3} className={inputClass()} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <Field label="Banner (URL ảnh)" name="bannerUrl" type="url" value={values.bannerUrl} error={errors.bannerUrl} placeholder="https://..." onChange={(e) => set("bannerUrl", e.target.value)} />
      <Checkbox label="Hiển thị trên cửa hàng" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
    </>
  ),
};
