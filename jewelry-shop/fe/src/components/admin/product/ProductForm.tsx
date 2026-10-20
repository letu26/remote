"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field, inputClass } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminForm } from "@/hooks/useAdminForm";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  adminCategoryService,
  adminCollectionService,
  adminGemstoneService,
  adminMaterialService,
} from "@/services/admin-catalog.service";
import { adminProductService } from "@/services/admin-product.service";
import type {
  AdminCategory,
  AdminCollection,
  AdminNamedItem,
  AdminProduct,
  AdminProductImage,
  TargetGroup,
} from "@/types/admin-catalog";
import { notify } from "@/utils/notify";
import { PRODUCT_CODE_FIELD } from "../admin-errors";
import { arrangeCategoryTree } from "../catalog-configs";
import { ProductImages } from "./ProductImages";
import { GemstonesEditor, VariantsEditor } from "./ProductRowEditors";
import {
  TARGET_GROUP_OPTIONS,
  emptyProductForm,
  formSnapshot,
  productToForm,
  resolveSkuConflict,
  toProductInput,
  validateProductForm,
  type ProductFormValues,
} from "./product-form";

interface Options {
  categories: AdminCategory[];
  materials: AdminNamedItem[];
  gemstones: AdminNamedItem[];
  collections: AdminCollection[];
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-paper p-4 shadow-card">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Form tạo/sửa sản phẩm dùng chung. `productId` có giá trị = đang sửa. */
export function ProductForm({ productId }: { productId?: number }) {
  const router = useRouter();
  const mode = productId === undefined ? "create" : "edit";
  const [options, setOptions] = useState<Options | null>(null);
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [values, setValues] = useState<ProductFormValues>(emptyProductForm);
  const [baseline, setBaseline] = useState(() => formSnapshot(emptyProductForm()));
  const [images, setImages] = useState<AdminProductImage[]>([]);
  const valuesRef = useRef(values);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const resolveConflict = useCallback(
    (e: { code: string; message: string }) => resolveSkuConflict(valuesRef.current, e),
    [],
  );
  const { errors, submitting, submit, clearError } = useAdminForm(PRODUCT_CODE_FIELD, resolveConflict);

  const load = useCallback(async () => {
    setLoadFailed(false);
    try {
      const [categories, materials, gemstones, collections, loaded] = await Promise.all([
        adminCategoryService.list(),
        adminMaterialService.list(),
        adminGemstoneService.list(),
        adminCollectionService.list(),
        productId === undefined ? Promise.resolve(null) : adminProductService.get(productId),
      ]);
      setOptions({ categories, materials, gemstones, collections });
      if (loaded) {
        const form = productToForm(loaded);
        setProduct(loaded);
        setValues(form);
        setBaseline(formSnapshot(form));
        setImages(loaded.images);
      }
    } catch {
      setLoadFailed(true);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu lần đầu
    void load();
  }, [load]);

  const dirty = formSnapshot(values) !== baseline;
  useUnsavedChanges(dirty && !leaving);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(String(key));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let saved: AdminProduct | null = null;
    const ok = await submit(validateProductForm(values, mode), async () => {
      const input = toProductInput(values, mode);
      if (productId === undefined) {
        saved = await adminProductService.create(input);
      } else {
        // Không gửi mã/slug nếu không đổi để tránh xung đột với chính nó.
        const patch = { ...input };
        if (product && patch.code === product.code) delete (patch as Partial<typeof patch>).code;
        if (product && patch.slug === product.slug) delete patch.slug;
        saved = await adminProductService.update(productId, patch);
      }
    });
    if (!ok || !saved) {
      // Cuộn tới ô lỗi đầu tiên để người dùng thấy.
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const result = saved as AdminProduct;
    if (productId === undefined) {
      setLeaving(true);
      notify("success", "Đã tạo sản phẩm. Hãy tải ảnh ở mục Ảnh sản phẩm.");
      router.replace(`/admin/products/${result.id}`);
    } else {
      const form = productToForm(result);
      setProduct(result);
      setValues(form);
      setBaseline(formSnapshot(form));
      setImages(result.images);
      notify("success", "Đã lưu thay đổi");
    }
  };

  const onStockChanged = (variantId: number, stock: number) =>
    setValues((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => (v.id === variantId ? { ...v, stock: String(stock) } : v)),
    }));

  if (loadFailed) return <ErrorState onRetry={load} />;
  if (!options)
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );

  const categoryOptions = [
    { value: "", label: "Chọn danh mục" },
    ...arrangeCategoryTree(options.categories).map((c) => ({ value: String(c.id), label: `${"— ".repeat(c.depth ?? 0)}${c.name}${c.isActive ? "" : " (đang ẩn)"}` })),
  ];
  const materialOptions = [{ value: "", label: "Không chọn" }, ...options.materials.map((m) => ({ value: String(m.id), label: m.name }))];
  const collectionOptions = [{ value: "", label: "Không chọn" }, ...options.collections.map((c) => ({ value: String(c.id), label: c.name }))];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/products" className="text-sm text-gold-deep hover:underline">
          &larr; Quay lại danh sách
        </Link>
        {dirty && <span className="text-xs font-medium text-gold-deeper">Có thay đổi chưa lưu</span>}
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5" aria-label={mode === "create" ? "Thêm sản phẩm" : "Sửa sản phẩm"}>

        <Section title="Thông tin cơ bản">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mã sản phẩm" name="code" value={values.code} error={errors.code} maxLength={50} onChange={(e) => set("code", e.target.value)} />
            <Field label="Tên sản phẩm" name="name" value={values.name} error={errors.name} maxLength={200} onChange={(e) => set("name", e.target.value)} />
          </div>
          <Field label="Slug (để trống để tự sinh)" name="slug" value={values.slug} error={errors.slug} onChange={(e) => set("slug", e.target.value)} />
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-ink">Mô tả</label>
            <textarea id="description" name="description" rows={4} className={inputClass(!!errors.description)} value={values.description} onChange={(e) => set("description", e.target.value)} />
            {errors.description && <p role="alert" className="text-xs text-danger">{errors.description}</p>}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Checkbox label="Hiển thị trên cửa hàng" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            <Checkbox label="Sản phẩm nổi bật" checked={values.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
          </div>
        </Section>

        <Section title="Phân loại">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Select label="Danh mục" name="categoryId" value={values.categoryId} options={categoryOptions} aria-invalid={!!errors.categoryId} onChange={(e) => set("categoryId", e.target.value)} />
              {errors.categoryId && <p role="alert" className="mt-1 text-xs text-danger">{errors.categoryId}</p>}
            </div>
            <Select label="Dành cho" name="targetGroup" value={values.targetGroup} options={TARGET_GROUP_OPTIONS} onChange={(e) => set("targetGroup", e.target.value as TargetGroup)} />
            <Select label="Chất liệu" name="materialId" value={values.materialId} options={materialOptions} onChange={(e) => set("materialId", e.target.value)} />
            <Select label="Bộ sưu tập" name="collectionId" value={values.collectionId} options={collectionOptions} onChange={(e) => set("collectionId", e.target.value)} />
          </div>
        </Section>

        <Section title="Giá và thông số" hint="Giá tính bằng VND, nhập số nguyên.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Giá nhập (₫)" name="costPrice" inputMode="numeric" value={values.costPrice} error={errors.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
            <Field label="Giá bán (₫)" name="price" inputMode="numeric" value={values.price} error={errors.price} onChange={(e) => set("price", e.target.value)} />
            <Field label="Trọng lượng (gam)" name="weight" inputMode="decimal" value={values.weight} error={errors.weight} onChange={(e) => set("weight", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bảo hành" name="warrantyInfo" value={values.warrantyInfo} error={errors.warrantyInfo} onChange={(e) => set("warrantyInfo", e.target.value)} />
            <Field label="Chứng nhận" name="certificate" value={values.certificate} error={errors.certificate} onChange={(e) => set("certificate", e.target.value)} />
          </div>
        </Section>

        <Section title="Đá quý" hint="Tùy chọn. Danh sách này thay thế toàn bộ đá quý của sản phẩm khi lưu.">
          <GemstonesEditor
            rows={values.gemstones}
            gemstones={options.gemstones}
            errors={errors}
            onChange={(rows) => set("gemstones", rows)}
            onClearError={clearError}
          />
        </Section>

        <Section title="Biến thể và tồn kho" hint="Cần ít nhất 1 biến thể. Sản phẩm không có size để trống ô Size.">
          <VariantsEditor
            rows={values.variants}
            errors={errors}
            productId={productId}
            onChange={(rows) => set("variants", rows)}
            onClearError={clearError}
            onStockChanged={onStockChanged}
          />
        </Section>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <ButtonLink href="/admin/products" variant="ghost">Hủy</ButtonLink>
          <Button type="submit" loading={submitting}>
            {mode === "create" ? "Tạo sản phẩm" : "Lưu thay đổi"}
          </Button>
        </div>
      </form>

      <Section title="Ảnh sản phẩm">
        {productId === undefined ? (
          <p className="text-sm text-muted">
            Lưu sản phẩm trước, sau đó trang sẽ chuyển sang chế độ chỉnh sửa để bạn tải ảnh lên.
          </p>
        ) : (
          <ProductImages productId={productId} images={images} onChange={setImages} />
        )}
      </Section>
    </div>
  );
}
