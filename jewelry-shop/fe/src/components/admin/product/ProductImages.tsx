"use client";

import { useRef, useState, type DragEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Field";
import { adminProductService } from "@/services/admin-product.service";
import type { AdminProductImage } from "@/types/admin-catalog";
import { confirmAction } from "@/utils/confirm";
import { notify } from "@/utils/notify";
import { adminErrorMessage } from "../admin-errors";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILES_PER_REQUEST,
  MAX_IMAGES_PER_PRODUCT,
  checkImageFiles,
  chunk,
  moveItem,
} from "./image-validation";

const sorted = (images: AdminProductImage[]) => [...images].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

export function ProductImages({
  productId,
  images,
  onChange,
}: {
  productId: number;
  images: AdminProductImage[];
  onChange: (images: AdminProductImage[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const list = sorted(images);

  const upload = async (picked: File[]) => {
    if (busy || picked.length === 0) return;
    const { valid, errors } = checkImageFiles(picked, images.length);
    setProblems(errors);
    if (valid.length === 0) return;
    setBusy(true);
    setProgress(0);
    let current = images;
    try {
      const batches = chunk(valid, MAX_FILES_PER_REQUEST);
      for (let b = 0; b < batches.length; b++) {
        const created = await adminProductService.uploadImages(productId, batches[b], (p) =>
          setProgress(Math.round(((b + p / 100) / batches.length) * 100)),
        );
        current = [...current, ...created];
        onChange(current);
      }
      notify("success", `Đã tải lên ${valid.length} ảnh`);
    } catch (e) {
      notify("error", adminErrorMessage(e));
    } finally {
      setBusy(false);
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void upload([...e.dataTransfer.files]);
  };

  const makePrimary = async (img: AdminProductImage) => {
    try {
      await adminProductService.updateImage(productId, img.id, { isPrimary: true });
      onChange(images.map((i) => ({ ...i, isPrimary: i.id === img.id })));
      notify("success", "Đã đặt ảnh đại diện");
    } catch (e) {
      notify("error", adminErrorMessage(e));
    }
  };

  const move = async (index: number, delta: -1 | 1) => {
    const next = moveItem(list, index, delta);
    if (next === list) return;
    const reordered = next.map((img, i) => ({ ...img, sortOrder: i }));
    onChange(reordered);
    try {
      await adminProductService.reorderImages(productId, reordered.map((i) => i.id));
    } catch (e) {
      onChange(images);
      notify("error", adminErrorMessage(e));
    }
  };

  const askDelete = async (img: AdminProductImage) => {
    const ok = await confirmAction({
      title: "Xóa ảnh",
      text: "Bạn có chắc muốn xóa ảnh này? Thao tác này không thể hoàn tác.",
      confirmText: "Xóa",
      tone: "danger",
    });
    if (!ok) return;
    setDeletingId(img.id);
    try {
      await adminProductService.removeImage(productId, img.id);
      const rest = sorted(images.filter((i) => i.id !== img.id));
      // Server chuyển ảnh đầu tiên còn lại thành ảnh đại diện khi xóa ảnh đại diện.
      const next = rest.map((item, i) => ({ ...item, isPrimary: img.isPrimary ? i === 0 : item.isPrimary }));
      onChange(next);
      notify("success", "Đã xóa ảnh");
    } catch (e) {
      notify("error", adminErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  };

  const full = images.length >= MAX_IMAGES_PER_PRODUCT;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? "border-gold-deep bg-gold-tint" : "border-line-strong bg-paper"
        }`}
      >
        <p className="text-sm text-ink">Kéo thả ảnh vào đây hoặc</p>
        <label className="mt-3 inline-block">
          <span className="sr-only">Chọn ảnh sản phẩm</span>
          <input
            ref={input}
            type="file"
            multiple
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            disabled={busy || full}
            onChange={(e) => void upload([...(e.target.files ?? [])])}
            className="block w-full max-w-xs text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-ui file:border file:border-gold-deep file:bg-paper file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gold-deep"
          />
        </label>
        <p className="mt-3 text-xs text-muted">
          jpg, png, webp; tối đa 5MB mỗi ảnh; tối đa {MAX_IMAGES_PER_PRODUCT} ảnh ({images.length}/{MAX_IMAGES_PER_PRODUCT} đã dùng)
        </p>
      </div>

      {progress !== null && (
        <div role="progressbar" aria-label="Tiến trình tải ảnh" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-sand">
            <div className="h-full bg-gold-deep transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted">Đang tải lên... {progress}%</p>
        </div>
      )}
      {problems.length > 0 && (
        <Alert>
          <ul className="list-inside list-disc">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Alert>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted">Sản phẩm chưa có ảnh.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-ui border border-line bg-paper">
              <div className="relative aspect-square bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh Cloudinary bên ngoài, trang quản trị */}
                <img src={img.url} alt={`Ảnh sản phẩm ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                {img.isPrimary && <Badge tone="gold" className="absolute left-2 top-2">Ảnh đại diện</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 p-2">
                {!img.isPrimary && (
                  <Button size="sm" variant="secondary" onClick={() => makePrimary(img)}>
                    Đặt làm đại diện
                  </Button>
                )}
                <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Chuyển ảnh ${i + 1} lên trước`}>
                  Lên
                </Button>
                <Button size="sm" variant="ghost" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label={`Chuyển ảnh ${i + 1} xuống sau`}>
                  Xuống
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto text-danger!" onClick={() => askDelete(img)} disabled={deletingId === img.id} aria-label={`Xóa ảnh ${i + 1}`}>
                  Xóa
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
