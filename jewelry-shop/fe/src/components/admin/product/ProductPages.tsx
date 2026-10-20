"use client";

import { useParams } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProductForm } from "./ProductForm";

export function ProductCreateView() {
  return <ProductForm />;
}

export function ProductEditView() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return <ErrorState title="Sản phẩm không tồn tại" description="Đường dẫn không hợp lệ." />;
  // key: đổi id thì khởi tạo lại toàn bộ form.
  return <ProductForm key={id} productId={id} />;
}
