"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Field";
import { adminMediaService } from "@/services/admin-media.service";
import { adminErrorMessage } from "../admin-errors";
import { ALLOWED_IMAGE_TYPES, checkImageFiles } from "../product/image-validation";

/** Chọn và tải MỘT ảnh lên `/admin/media/images`, có xem trước và tiến trình. */
export function ImageUploadField({
  label,
  url,
  onChange,
  error,
}: {
  label: string;
  url: string;
  /** Gọi khi tải xong (url, publicId) hoặc khi bỏ ảnh ("", ""). */
  onChange: (url: string, publicId: string) => void;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [problem, setProblem] = useState("");

  const pick = async (file: File | undefined) => {
    if (!file || progress !== null) return;
    const { valid, errors } = checkImageFiles([file], 0);
    if (valid.length === 0) {
      setProblem(errors[0] ?? "Ảnh không hợp lệ");
      return;
    }
    setProblem("");
    setProgress(0);
    try {
      const res = await adminMediaService.uploadImage(file, setProgress);
      onChange(res.url, res.publicId);
    } catch (e) {
      setProblem(adminErrorMessage(e));
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-ink" id="image-upload-label">{label}</span>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh Cloudinary bên ngoài, trang quản trị
        <img src={url} alt="Xem trước ảnh" className="h-32 w-full max-w-xs rounded-ui border border-line object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          aria-labelledby="image-upload-label"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          disabled={progress !== null}
          onChange={(e) => void pick(e.target.files?.[0])}
          className="block max-w-full text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-ui file:border file:border-gold-deep file:bg-paper file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gold-deep"
        />
        {url && progress === null && (
          <Button size="sm" variant="ghost" onClick={() => onChange("", "")}>
            Bỏ ảnh
          </Button>
        )}
      </div>
      <p className="text-xs text-muted">jpg, png, webp; tối đa 5MB.</p>
      {progress !== null && (
        <div role="progressbar" aria-label="Tiến trình tải ảnh" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-sand">
            <div className="h-full bg-gold-deep transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted">Đang tải lên... {progress}%</p>
        </div>
      )}
      {problem && <Alert>{problem}</Alert>}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}
