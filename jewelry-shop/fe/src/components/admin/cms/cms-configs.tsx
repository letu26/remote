import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field, inputClass } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { adminBannerService, adminFaqService, adminMenuService, adminPageService } from "@/services/admin-cms.service";
import type { CrudService } from "@/services/admin-catalog.service";
import type {
  AdminBanner,
  AdminFaq,
  AdminMenu,
  AdminPage,
  BannerInput,
  BannerPosition,
  FaqInput,
  MenuInput,
  MenuPlacement,
  PageInput,
} from "@/types/admin-cms";
import { notify } from "@/utils/notify";
import type { FormErrors } from "@/utils/validators";
import { adminErrorMessage, SLUG_CODE_FIELD } from "../admin-errors";
import type { CrudConfig } from "../CrudPage";
import { ImageUploadField } from "./ImageUploadField";
import { MarkdownEditor } from "./MarkdownEditor";
import {
  parseKeywords,
  validateContent,
  validateHttpsUrl,
  validateKeywords,
  validateLink,
  validatePageSlug,
} from "./cms-validation";

/** CrudPage cần `name` để hiển thị/xác nhận: ghép thêm `name` từ trường tiêu đề của từng loại. */
function withName<T extends { id: number }, I>(
  svc: CrudService<T, I>,
  pick: (row: T) => string,
): CrudService<T & { name: string }, I> {
  const add = (row: T) => ({ ...row, name: pick(row) });
  return {
    list: async () => (await svc.list()).map(add),
    create: async (input) => add(await svc.create(input)),
    update: async (id, input) => add(await svc.update(id, input)),
    remove: (id) => svc.remove(id),
  };
}

const intOrEmpty = (v: string) => (v.trim() && !/^-?\d+$/.test(v.trim()) ? "Thứ tự phải là số nguyên" : undefined);

// ---------- Banner ----------
export type BannerRow = AdminBanner & { name: string };
export interface BannerValues {
  title: string;
  imageUrl: string;
  imagePublicId: string;
  linkUrl: string;
  position: BannerPosition;
  sortOrder: string;
  isActive: boolean;
}
export const POSITION_LABEL: Record<BannerPosition, string> = {
  home_hero: "Băng chuyền đầu trang chủ",
  home_promo: "Ô quảng cáo trang chủ",
};

export function validateBanner(v: BannerValues): FormErrors {
  const e: FormErrors = {};
  const title = v.title.trim();
  if (title.length < 1 || title.length > 150) e.title = "Tiêu đề từ 1 đến 150 ký tự";
  if (!v.imageUrl.trim()) e.imageUrl = "Vui lòng tải ảnh banner";
  else {
    const u = validateHttpsUrl(v.imageUrl, 500);
    if (u) e.imageUrl = u;
  }
  const link = validateLink(v.linkUrl);
  if (link) e.linkUrl = link;
  const so = intOrEmpty(v.sortOrder);
  if (so) e.sortOrder = so;
  return e;
}

export const bannerConfig: CrudConfig<BannerRow, BannerValues, BannerInput> = {
  entity: "banner",
  title: "Danh sách banner",
  service: withName(adminBannerService, (b) => b.title),
  modalSize: "lg",
  emptyValues: { title: "", imageUrl: "", imagePublicId: "", linkUrl: "", position: "home_hero", sortOrder: "0", isActive: true },
  toValues: (r) => ({
    title: r.title,
    imageUrl: r.imageUrl,
    imagePublicId: "",
    linkUrl: r.linkUrl ?? "",
    position: r.position,
    sortOrder: String(r.sortOrder),
    isActive: r.isActive,
  }),
  validate: validateBanner,
  toInput: (v) => ({
    title: v.title.trim(),
    imageUrl: v.imageUrl.trim(),
    ...(v.imagePublicId ? { imagePublicId: v.imagePublicId } : {}),
    linkUrl: v.linkUrl.trim(),
    position: v.position,
    sortOrder: v.sortOrder.trim() ? Number(v.sortOrder) : 0,
    isActive: v.isActive,
  }),
  columns: [
    {
      header: "Ảnh",
      cell: (r) => (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh Cloudinary bên ngoài, trang quản trị
        <img src={r.imageUrl} alt={`Banner ${r.title}`} loading="lazy" className="h-12 w-24 rounded-ui border border-line object-cover" />
      ),
    },
    { header: "Tiêu đề", cell: (r) => <span className="font-medium text-ink">{r.title}</span> },
    { header: "Vị trí", cell: (r) => POSITION_LABEL[r.position] },
    { header: "Liên kết", cell: (r) => <span className="break-all text-xs text-muted">{r.linkUrl || "-"}</span> },
    { header: "Thứ tự", cell: (r) => r.sortOrder },
  ],
  renderFields: ({ values, errors, set }) => (
    <>
      <Field label="Tiêu đề" name="title" value={values.title} error={errors.title} maxLength={150} onChange={(e) => set("title", e.target.value)} />
      <ImageUploadField
        label="Ảnh banner"
        url={values.imageUrl}
        error={errors.imageUrl}
        onChange={(url, publicId) => {
          set("imageUrl", url);
          set("imagePublicId", publicId);
        }}
      />
      <Field label="Liên kết (tùy chọn)" name="linkUrl" value={values.linkUrl} error={errors.linkUrl} placeholder="/products hoặc https://..." onChange={(e) => set("linkUrl", e.target.value)} />
      <Select
        label="Vị trí"
        name="position"
        value={values.position}
        options={(Object.keys(POSITION_LABEL) as BannerPosition[]).map((p) => ({ value: p, label: POSITION_LABEL[p] }))}
        onChange={(e) => set("position", e.target.value as BannerPosition)}
      />
      <Field label="Thứ tự hiển thị" name="sortOrder" inputMode="numeric" value={values.sortOrder} error={errors.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
      <Checkbox label="Hiển thị trên cửa hàng" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
    </>
  ),
};

// ---------- Menu ----------
export type MenuRow = AdminMenu & { name: string };
export interface MenuValues {
  label: string;
  url: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}

export function validateMenu(v: MenuValues): FormErrors {
  const e: FormErrors = {};
  const label = v.label.trim();
  if (label.length < 1 || label.length > 100) e.label = "Nhãn từ 1 đến 100 ký tự";
  const url = validateLink(v.url, true);
  if (url) e.url = url;
  const so = intOrEmpty(v.sortOrder);
  if (so) e.sortOrder = so;
  return e;
}

/** Cây hai cấp theo vị trí: mục gốc theo thứ tự, mỗi mục kèm con ngay sau. */
export function arrangeMenuTree<T extends AdminMenu>(rows: T[], placement: MenuPlacement): (T & { depth: number })[] {
  const inPlace = rows.filter((r) => r.placement === placement);
  const cmp = (a: T, b: T) => a.sortOrder - b.sortOrder || a.id - b.id;
  const roots = inPlace.filter((r) => r.parentId === null).sort(cmp);
  const out: (T & { depth: number })[] = [];
  for (const root of roots) {
    out.push({ ...root, depth: 0 });
    for (const child of inPlace.filter((r) => r.parentId === root.id).sort(cmp)) out.push({ ...child, depth: 1 });
  }
  return out;
}

/** Đổi chỗ một mục với anh em liền kề; trả danh sách {id, sortOrder} cần cập nhật (đánh số lại 0..n-1). */
export function computeReorder(
  siblings: { id: number; sortOrder: number }[],
  index: number,
  delta: -1 | 1,
): { id: number; sortOrder: number }[] {
  const target = index + delta;
  if (index < 0 || target < 0 || target >= siblings.length) return [];
  const order = siblings.map((s) => s.id);
  [order[index], order[target]] = [order[target], order[index]];
  const changes: { id: number; sortOrder: number }[] = [];
  order.forEach((id, i) => {
    const old = siblings.find((s) => s.id === id)!;
    if (old.sortOrder !== i) changes.push({ id, sortOrder: i });
  });
  return changes;
}

const menuService = withName(adminMenuService, (m) => m.label);

function makeMenuConfig(placement: MenuPlacement): CrudConfig<MenuRow, MenuValues, MenuInput> {
  return {
    entity: "mục menu",
    title: placement === "header" ? "Menu đầu trang" : "Menu chân trang",
    service: menuService,
    arrange: (rows) => arrangeMenuTree(rows, placement),
    emptyValues: { label: "", url: "", parentId: "", sortOrder: "0", isActive: true },
    toValues: (r) => ({ label: r.label, url: r.url, parentId: r.parentId === null ? "" : String(r.parentId), sortOrder: String(r.sortOrder), isActive: r.isActive }),
    validate: validateMenu,
    toInput: (v, editing) => ({
      label: v.label.trim(),
      url: v.url.trim(),
      parentId: v.parentId ? Number(v.parentId) : editing ? null : undefined,
      placement,
      sortOrder: v.sortOrder.trim() ? Number(v.sortOrder) : 0,
      isActive: v.isActive,
    }),
    beforeDelete: (row, rows) =>
      rows.some((r) => r.parentId === row.id) ? `Mục "${row.label}" còn mục con. Hãy xóa các mục con trước.` : null,
    columns: [
      {
        header: "Nhãn",
        cell: (r) => {
          const depth = (r as MenuRow & { depth?: number }).depth ?? 0;
          return (
            <span className="font-medium text-ink" style={{ paddingLeft: `${depth * 1.25}rem` }}>
              {depth > 0 && <span aria-hidden className="mr-1 text-muted">└</span>}
              {r.label}
            </span>
          );
        },
      },
      { header: "Đường dẫn", cell: (r) => <code className="break-all text-xs text-muted">{r.url}</code> },
      { header: "Thứ tự", cell: (r) => r.sortOrder },
    ],
    rowActions: ({ row, shown, reload }) => {
      const list = shown.filter((s) => s.parentId === row.parentId);
      const index = list.findIndex((s) => s.id === row.id);
      const move = async (delta: -1 | 1) => {
        const changes = computeReorder(list, index, delta);
        try {
          await Promise.all(changes.map((c) => menuService.update(c.id, { sortOrder: c.sortOrder })));
          reload();
        } catch (err) {
          notify("error", adminErrorMessage(err));
        }
      };
      return (
        <>
          <Button size="sm" variant="ghost" disabled={index <= 0} onClick={() => move(-1)} aria-label={`Chuyển ${row.label} lên`}>
            Lên
          </Button>
          <Button size="sm" variant="ghost" disabled={index < 0 || index >= list.length - 1} onClick={() => move(1)} aria-label={`Chuyển ${row.label} xuống`}>
            Xuống
          </Button>
        </>
      );
    },
    renderFields: ({ values, errors, set, rows, editing }) => {
      const hasChildren = !!editing && rows.some((r) => r.parentId === editing.id);
      const roots = rows.filter((r) => r.placement === placement && r.parentId === null && r.id !== editing?.id).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      return (
        <>
          <Field label="Nhãn" name="label" value={values.label} error={errors.label} maxLength={100} onChange={(e) => set("label", e.target.value)} />
          <Field label="Đường dẫn" name="url" value={values.url} error={errors.url} placeholder="/products hoặc https://..." onChange={(e) => set("url", e.target.value)} />
          <Select
            label="Mục cha (chỉ chọn mục gốc)"
            name="parentId"
            value={values.parentId}
            disabled={hasChildren}
            options={[{ value: "", label: "Không có (mục gốc)" }, ...roots.map((r) => ({ value: String(r.id), label: r.label }))]}
            onChange={(e) => set("parentId", e.target.value)}
          />
          {hasChildren && <p className="text-xs text-muted">Mục đang có mục con nên không thể đặt làm mục con (tối đa 2 cấp).</p>}
          {errors.parentId && <p role="alert" className="text-xs text-danger">{errors.parentId}</p>}
          <Field label="Thứ tự hiển thị" name="sortOrder" inputMode="numeric" value={values.sortOrder} error={errors.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
          <Checkbox label="Hiển thị" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
        </>
      );
    },
  };
}
export const menuConfigs: Record<MenuPlacement, CrudConfig<MenuRow, MenuValues, MenuInput>> = {
  header: makeMenuConfig("header"),
  footer: makeMenuConfig("footer"),
};

// ---------- Trang nội dung ----------
export type PageRow = AdminPage & { name: string };
export interface PageValues {
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
}

export function validatePage(v: PageValues, reserved: boolean): FormErrors {
  const e: FormErrors = {};
  if (!reserved) {
    const slug = validatePageSlug(v.slug);
    if (slug) e.slug = slug;
  }
  const title = v.title.trim();
  if (title.length < 1 || title.length > 255) e.title = "Tiêu đề từ 1 đến 255 ký tự";
  const content = validateContent(v.content);
  if (content) e.content = content;
  return e;
}

const pageService = withName(adminPageService, (p) => p.title);

export const pageConfig: CrudConfig<PageRow, PageValues, PageInput> = {
  entity: "trang nội dung",
  title: "Danh sách trang nội dung",
  service: pageService,
  modalSize: "lg",
  codeFields: { ...SLUG_CODE_FIELD, RESERVED_PAGE: "slug" },
  emptyValues: { slug: "", title: "", content: "", isActive: true },
  toValues: (r) => ({ slug: r.slug, title: r.title, content: r.content ?? "", isActive: r.isActive }),
  loadForEdit: async (row) => ({ ...(await adminPageService.get(row.id)), name: row.name }),
  validate: (v) => validatePage(v, false),
  toInput: (v, editing) => ({
    // Trang hệ thống hoặc slug không đổi: không gửi slug (tránh RESERVED_PAGE).
    ...(!editing || (!editing.isReserved && editing.slug !== v.slug.trim()) ? { slug: v.slug.trim() } : {}),
    title: v.title.trim(),
    content: v.content,
    isActive: v.isActive,
  }),
  canDelete: (r) => !r.isReserved,
  columns: [
    { header: "Tiêu đề", cell: (r) => <span className="font-medium text-ink">{r.title}</span> },
    {
      header: "Slug",
      cell: (r) => (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <code className="text-xs text-muted">{r.slug}</code>
          {r.isReserved && <span className="rounded-full bg-gold-tint px-2 py-0.5 text-[11px] font-semibold text-gold-deeper">Trang hệ thống</span>}
        </span>
      ),
    },
  ],
  renderFields: ({ values, errors, set, editing }) => (
    <>
      <Field label="Tiêu đề" name="title" value={values.title} error={errors.title} maxLength={255} onChange={(e) => set("title", e.target.value)} />
      <Field
        label="Slug (a-z, 0-9, gạch ngang)"
        name="slug"
        value={values.slug}
        error={errors.slug}
        disabled={!!editing?.isReserved}
        onChange={(e) => set("slug", e.target.value)}
      />
      {editing?.isReserved && <p className="text-xs text-muted">Đây là trang hệ thống: không đổi slug và không xóa được.</p>}
      <MarkdownEditor value={values.content} error={errors.content} onChange={(v) => set("content", v)} />
      <Checkbox label="Hiển thị" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
    </>
  ),
};

// ---------- FAQ ----------
export type FaqRow = AdminFaq & { name: string };
export interface FaqValues {
  question: string;
  answer: string;
  keywords: string;
  sortOrder: string;
  isActive: boolean;
}

export function validateFaq(v: FaqValues): FormErrors {
  const e: FormErrors = {};
  const q = v.question.trim();
  if (q.length < 3 || q.length > 500) e.question = "Câu hỏi từ 3 đến 500 ký tự";
  const a = v.answer.trim();
  if (a.length < 1 || a.length > 2000) e.answer = "Câu trả lời từ 1 đến 2000 ký tự";
  const k = validateKeywords(v.keywords);
  if (k) e.keywords = k;
  const so = intOrEmpty(v.sortOrder);
  if (so) e.sortOrder = so;
  return e;
}

export const faqConfig: CrudConfig<FaqRow, FaqValues, FaqInput> = {
  entity: "câu hỏi",
  title: "Danh sách câu hỏi thường gặp",
  service: withName(adminFaqService, (f) => f.question),
  modalSize: "lg",
  emptyValues: { question: "", answer: "", keywords: "", sortOrder: "0", isActive: true },
  toValues: (r) => ({ question: r.question, answer: r.answer, keywords: r.keywords ?? "", sortOrder: String(r.sortOrder), isActive: r.isActive }),
  validate: validateFaq,
  toInput: (v) => ({
    question: v.question.trim(),
    answer: v.answer.trim(),
    keywords: parseKeywords(v.keywords).join(", "),
    sortOrder: v.sortOrder.trim() ? Number(v.sortOrder) : 0,
    isActive: v.isActive,
  }),
  columns: [
    { header: "Câu hỏi", cell: (r) => <span className="line-clamp-2 max-w-sm font-medium text-ink">{r.question}</span> },
    { header: "Từ khóa", cell: (r) => <span className="line-clamp-2 max-w-xs text-xs text-muted">{r.keywords || "-"}</span> },
    { header: "Thứ tự", cell: (r) => r.sortOrder },
  ],
  renderFields: ({ values, errors, set }) => (
    <>
      <Field label="Câu hỏi" name="question" value={values.question} error={errors.question} maxLength={500} onChange={(e) => set("question", e.target.value)} />
      <div className="space-y-1.5">
        <label htmlFor="answer" className="block text-sm font-medium text-ink">Câu trả lời</label>
        <textarea id="answer" name="answer" rows={4} maxLength={2000} aria-invalid={!!errors.answer} className={inputClass(!!errors.answer)} value={values.answer} onChange={(e) => set("answer", e.target.value)} />
        {errors.answer && <p role="alert" className="text-xs text-danger">{errors.answer}</p>}
      </div>
      <div>
        <Field label="Từ khóa (cách nhau dấu phẩy)" name="keywords" value={values.keywords} error={errors.keywords} placeholder="bảo hành, đổi trả" onChange={(e) => set("keywords", e.target.value)} />
        <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Từ khóa đã nhập">
          {parseKeywords(values.keywords).map((k, i) => (
            <span key={`${k}-${i}`} className="rounded-full bg-gold-tint px-2 py-0.5 text-xs text-gold-deeper">{k}</span>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">Mỗi từ khóa 2..50 ký tự, tối đa 20 từ khóa.</p>
      </div>
      <Field label="Thứ tự hiển thị" name="sortOrder" inputMode="numeric" value={values.sortOrder} error={errors.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
      <Checkbox label="Hiển thị" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
    </>
  ),
};
