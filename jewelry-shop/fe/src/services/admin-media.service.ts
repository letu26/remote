import { http } from "./http";
import type { UploadedImage } from "@/types/admin-cms";

export const adminMediaService = {
  /** Tải MỘT ảnh (field `file`), báo tiến trình 0..100. */
  async uploadImage(file: File, onProgress?: (percent: number) => void): Promise<UploadedImage> {
    const form = new FormData();
    form.append("file", file);
    const res = await http.post<UploadedImage>("/admin/media/images", form, {
      headers: { "Content-Type": undefined },
      timeout: 120000,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return res.data;
  },
};
