"use client";

import { useParams } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { ArticleForm } from "./ArticleForm";

export function ArticleCreateView() {
  return <ArticleForm />;
}

export function ArticleEditView() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return <ErrorState title="Bài viết không tồn tại" description="Đường dẫn không hợp lệ." />;
  return <ArticleForm key={id} articleId={id} />;
}
