import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductListing } from "@/components/product/ProductListing";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Trang sức" };

export default function ProductsPage() {
  return (
    // useSearchParams bắt buộc nằm trong Suspense khi bật cacheComponents.
    <Suspense
      fallback={
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-4 py-12 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <ProductListing />
    </Suspense>
  );
}
