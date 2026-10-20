"use client";

import Image from "next/image";
import { useState } from "react";
import type { ArtSpec, MetalSlug } from "@/types/catalog";
import { ProductArt } from "./ProductArt";

/**
 * Ảnh sản phẩm: ảnh thật qua next/image (Cloudinary); chưa có ảnh hoặc ảnh lỗi thì rơi về ảnh minh họa.
 * Cha phải có `relative` và kích thước (ví dụ aspect-square).
 */
export function ProductImage({
  url,
  alt,
  art,
  metal,
  variant = 0,
  sizes,
  priority = false,
}: {
  url: string | null | undefined;
  alt: string;
  art: ArtSpec;
  metal: MetalSlug;
  variant?: number;
  sizes: string;
  priority?: boolean;
}) {
  // Nhớ URL đã lỗi (không phải cờ chung) để đổi ảnh khác vẫn thử tải lại.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) {
    return <ProductArt art={art} metal={metal} variant={variant} label={alt} />;
  }
  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      priority={priority}
      className="img-fade object-cover"
      onError={() => setFailedUrl(url)}
    />
  );
}
