import { http } from "./http";
import type {
  AdminProduct,
  AdminProductImage,
  AdminProductListItem,
  Paged,
  ProductInput,
  ProductListQuery,
  StockChange,
  StockResult,
} from "@/types/admin-catalog";

const base = "/admin/products";

export const adminProductService = {
  async list(query: ProductListQuery): Promise<Paged<AdminProductListItem>> {
    const params: Record<string, string | number | boolean> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.q) params.q = query.q;
    if (query.categoryId) params.categoryId = query.categoryId;
    if (query.isActive !== undefined) params.isActive = query.isActive;
    return (await http.get<Paged<AdminProductListItem>>(base, { params })).data;
  },
  async get(id: number): Promise<AdminProduct> {
    return (await http.get<AdminProduct>(`${base}/${id}`)).data;
  },
  async create(input: ProductInput): Promise<AdminProduct> {
    return (await http.post<AdminProduct>(base, input)).data;
  },
  async update(id: number, input: Partial<ProductInput>): Promise<AdminProduct> {
    return (await http.patch<AdminProduct>(`${base}/${id}`, input)).data;
  },
  async setActive(id: number, isActive: boolean): Promise<AdminProduct> {
    return (await http.patch<AdminProduct>(`${base}/${id}`, { isActive })).data;
  },
  async remove(id: number): Promise<void> {
    await http.delete(`${base}/${id}`);
  },
  async changeStock(id: number, variantId: number, change: StockChange): Promise<StockResult> {
    return (await http.patch<StockResult>(`${base}/${id}/variants/${variantId}/stock`, change)).data;
  },

  /** Tải nhiều ảnh (field `files`), báo tiến trình 0..100. */
  async uploadImages(id: number, files: File[], onProgress?: (percent: number) => void): Promise<AdminProductImage[]> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const res = await http.post<AdminProductImage[]>(`${base}/${id}/images`, form, {
      // Để trình duyệt tự đặt boundary của multipart.
      headers: { "Content-Type": undefined },
      timeout: 120000,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return res.data;
  },
  async updateImage(id: number, imageId: number, patch: { isPrimary?: boolean; sortOrder?: number }): Promise<AdminProductImage> {
    return (await http.patch<AdminProductImage>(`${base}/${id}/images/${imageId}`, patch)).data;
  },
  async reorderImages(id: number, imageIds: number[]): Promise<void> {
    await http.put(`${base}/${id}/images/order`, { imageIds });
  },
  async removeImage(id: number, imageId: number): Promise<void> {
    await http.delete(`${base}/${id}/images/${imageId}`);
  },
};
