"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field, inputClass } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminForm } from "@/hooks/useAdminForm";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { adminArticleService } from "@/services/admin-cms.service";
import type { AdminArticle, ArticleInput } from "@/types/admin-cms";
import { notify } from "@/utils/notify";
import type { FormErrors } from "@/utils/validators";
import { SLUG_CODE_FIELD } from "../admin-errors";
import { SLUG_REGEX } from "../catalog-configs";
import { ImageUploadField } from "./ImageUploadField";
import { MarkdownEditor } from "./MarkdownEditor";
import { validateContent } from "./cms-validation";

export interface ArticleValues {
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnailUrl: string;
  /** Chỉ có khi vừa tải ảnh mới trong phiên sửa này. */
  thumbnailPublicId: string;
}
export const SUMMARY_MAX = 500;

export const emptyArticle = (): ArticleValues => ({ title: "", slug: "", summary: "", content: "", thumbnailUrl: "", thumbnailPublicId: "" });
export const articleToValues = (a: AdminArticle): ArticleValues => ({
  title: a.title,
  slug: a.slug,
  summary: a.summary ?? "",
  content: a.content,
  thumbnailUrl: a.thumbnailUrl ?? "",
  thumbnailPublicId: "",
});

export function validateArticle(v: ArticleValues): FormErrors {
  const e: FormErrors = {};
  const t = v.title.trim();
  if (t.length < 3 || t.length > 255) e.title = "Tiêu đề từ 3 đến 255 ký tự";
  if (v.slug.trim() && !SLUG_REGEX.test(v.slug.trim())) e.slug = "Slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang";
  if (v.summary.length > SUMMARY_MAX) e.summary = `Tóm tắt tối đa ${SUMMARY_MAX} ký tự`;
  const c = validateContent(v.content);
  if (c) e.content = c;
  return e;
}

export function toArticleInput(v: ArticleValues, isPublished: boolean, original?: AdminArticle | null): ArticleInput {
  return {
    title: v.title.trim(),
    ...(v.slug.trim() && v.slug.trim() !== original?.slug ? { slug: v.slug.trim() } : {}),
    summary: v.summary.trim(),
    content: v.content,
    thumbnailUrl: v.thumbnailUrl.trim(),
    ...(v.thumbnailPublicId ? { thumbnailPublicId: v.thumbnailPublicId } : {}),
    isPublished,
  };
}

const snapshot = (v: ArticleValues) => JSON.stringify(v);

/** Form tạo/sửa bài viết. `articleId` có giá trị = đang sửa. */
export function ArticleForm({ articleId }: { articleId?: number }) {
  const router = useRouter();
  const [article, setArticle] = useState<AdminArticle | null>(null);
  const [loaded, setLoaded] = useState(articleId === undefined);
  const [failed, setFailed] = useState(false);
  const [values, setValues] = useState<ArticleValues>(emptyArticle);
  const [baseline, setBaseline] = useState(() => snapshot(emptyArticle()));
  const [leaving, setLeaving] = useState(false);
  const { errors, submitting, submit, clearError } = useAdminForm(SLUG_CODE_FIELD);

  const load = useCallback(async () => {
    if (articleId === undefined) return;
    setFailed(false);
    try {
      const a = await adminArticleService.get(articleId);
      const v = articleToValues(a);
      setArticle(a);
      setValues(v);
      setBaseline(snapshot(v));
      setLoaded(true);
    } catch {
      setFailed(true);
    }
  }, [articleId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu lần đầu
    void load();
  }, [load]);

  const dirty = snapshot(values) !== baseline;
  useUnsavedChanges(dirty && !leaving);

  const set = <K extends keyof ArticleValues>(key: K, value: ArticleValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const save = async (isPublished: boolean, successMessage: string) => {
    let saved: AdminArticle | null = null;
    const ok = await submit(validateArticle(values), async () => {
      const input = toArticleInput(values, isPublished, article);
      saved = articleId === undefined ? await adminArticleService.create(input) : await adminArticleService.update(articleId, input);
    });
    if (!ok || !saved) return;
    const result = saved as AdminArticle;
    notify("success", successMessage);
    if (articleId === undefined) {
      setLeaving(true);
      router.replace(`/admin/articles/${result.id}`);
    } else {
      const v = articleToValues(result);
      setArticle(result);
      setValues(v);
      setBaseline(snapshot(v));
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void save(article?.isPublished ?? false, article?.isPublished ? "Đã lưu thay đổi" : "Đã lưu nháp");
  };

  if (failed) return <ErrorState onRetry={load} />;
  if (!loaded)
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  const published = article?.isPublished ?? false;
  return (
    <form onSubmit={onSubmit} noValidate aria-label={articleId === undefined ? "Thêm bài viết" : "Sửa bài viết"} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/articles" className="text-sm text-gold-deep hover:underline">&larr; Quay lại danh sách</Link>
        <div className="flex items-center gap-2">
          {article && <Badge tone={published ? "success" : "neutral"}>{published ? "Đã đăng" : "Bản nháp"}</Badge>}
          {dirty && <span className="text-xs font-medium text-gold-deeper">Có thay đổi chưa lưu</span>}
        </div>
      </div>

      <section className="space-y-4 rounded-lg border border-line bg-paper p-5 shadow-card">
        <Field label="Tiêu đề" name="title" value={values.title} error={errors.title} maxLength={255} onChange={(e) => set("title", e.target.value)} />
        <Field label="Slug (để trống để tự sinh)" name="slug" value={values.slug} error={errors.slug} onChange={(e) => set("slug", e.target.value)} />
        <div className="space-y-1.5">
          <label htmlFor="summary" className="block text-sm font-medium text-ink">Tóm tắt</label>
          <textarea id="summary" name="summary" rows={3} aria-invalid={!!errors.summary} className={inputClass(!!errors.summary)} value={values.summary} onChange={(e) => set("summary", e.target.value)} />
          <div className="flex justify-between text-xs">
            <span role={errors.summary ? "alert" : undefined} className="text-danger">{errors.summary}</span>
            <span data-testid="summary-count" className={values.summary.length > SUMMARY_MAX ? "font-semibold text-danger" : "text-muted"}>
              {values.summary.length}/{SUMMARY_MAX}
            </span>
          </div>
        </div>
        <ImageUploadField
          label="Ảnh đại diện"
          url={values.thumbnailUrl}
          onChange={(url, publicId) => {
            set("thumbnailUrl", url);
            set("thumbnailPublicId", publicId);
          }}
        />
      </section>

      <section className="rounded-lg border border-line bg-paper p-5 shadow-card">
        <MarkdownEditor value={values.content} error={errors.content} onChange={(v) => set("content", v)} />
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {published ? (
          <>
            <Button variant="ghost" disabled={submitting} onClick={() => void save(false, "Đã gỡ đăng bài viết")}>Gỡ đăng</Button>
            <Button type="submit" loading={submitting}>Lưu thay đổi</Button>
          </>
        ) : (
          <>
            <Button type="submit" variant="secondary" loading={submitting}>Lưu nháp</Button>
            <Button disabled={submitting} onClick={() => void save(true, "Đã đăng bài viết")}>Đăng</Button>
          </>
        )}
      </div>
    </form>
  );
}
