"use client";

import { useEffect } from "react";
import { Section, SectionHeading } from "@/components/home/HomeSections";
import { ProductCard } from "@/components/product/ProductCard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { recommendationService } from "@/services/recommendation.service";
import { useAuth } from "@/store/auth-context";
import { loadViews, recordView } from "@/utils/view-history";

/**
 * Khối "Gợi ý cho bạn" theo lịch sử xem, giỏ hàng và đơn đã mua. Chưa có tín hiệu hoặc lỗi thì ẩn cả khối.
 * `productId`: sản phẩm đang xem, được ghi vào lịch sử và không gợi ý lại.
 */
export function Recommendations({ productId }: { productId?: number }) {
  const { user } = useAuth();

  useEffect(() => {
    if (productId) recordView(productId);
  }, [productId]);

  // Khóa theo người dùng: đăng nhập / đăng xuất thì tải lại.
  const { data } = useAsyncData(`recommendations-${user?.id ?? "guest"}-${productId ?? ""}`, (signal) =>
    recommendationService.list(loadViews(), productId, signal),
  );

  if (!data?.personalized) return null;
  const grid = (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {data.items.map((p) => (
        <li key={p.id} className="flex">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
  // Trang chi tiết đã có khung riêng; trang chủ dùng Section như các khối khác.
  return productId ? (
    <section className="mt-10" aria-label="Gợi ý cho bạn">
      <h2 className="mb-6 font-serif text-3xl text-ink">Gợi ý cho bạn</h2>
      {grid}
    </section>
  ) : (
    <Section>
      <SectionHeading title="Gợi ý cho bạn" kicker="Dựa trên sở thích của bạn" />
      {grid}
    </Section>
  );
}
