import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductBuyBox, ProductGallery } from "@/components/product/ProductDetailClient";
import { ProductCard } from "@/components/product/ProductCard";
import { LiveRating, ReviewSection } from "@/components/product/ReviewSection";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ErrorState } from "@/components/ui/ErrorState";
import { Price } from "@/components/ui/Price";
import { Skeleton } from "@/components/ui/Skeleton";
import { POLICIES } from "@/constants/site";
import { getProduct } from "@/services/product.service";
import type { ProductDetail } from "@/types/catalog";
import { specRows } from "@/utils/product-specs";

const POLICY_PAGE: Record<string, string> = {
  "bao-hanh": "/pages/chinh-sach-bao-hanh",
  "doi-tra": "/pages/chinh-sach-doi-tra",
  "giao-hang": "/pages/chinh-sach-giao-hang",
};

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return product
      ? { title: product.name, description: product.description ?? undefined }
      : { title: "Không tìm thấy sản phẩm" };
  } catch {
    return { title: "Chi tiết sản phẩm" };
  }
}

export default function ProductDetailPage({ params }: PageProps<"/products/[slug]">) {
  return (
    // Dữ liệu động (params + API) phải nằm trong Suspense khi bật cacheComponents.
    <Suspense fallback={<DetailSkeleton />}>
      <ProductDetailContent params={params} />
    </Suspense>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 lg:grid-cols-2" aria-hidden>
      <Skeleton className="aspect-square" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

async function ProductDetailContent({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const { slug } = await params;
  let product: ProductDetail | null;
  try {
    product = await getProduct(slug);
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          title="Không tải được sản phẩm"
          description="Vui lòng kiểm tra kết nối và tải lại trang."
        />
      </div>
    );
  }
  if (!product) notFound();

  const specs = specRows(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Trang sức", href: "/products" },
          ...product.breadcrumb.map((c) => ({ label: c.name, href: `/products?category=${c.slug}` })),
          { label: product.name },
        ]}
      />

      <div className="mt-4 grid gap-6 lg:gap-10 lg:grid-cols-2">
        <ProductGallery product={product} />

        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {product.discountPercent ? <Badge tone="sale">Giảm {product.discountPercent}%</Badge> : null}
              {!product.inStock && <Badge tone="soldout">Hết hàng</Badge>}
            </div>
            <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">{product.name}</h1>
            <p className="mt-2 text-sm text-muted">Mã sản phẩm: {product.code}</p>
            <div className="mt-3">
              <LiveRating productId={product.id} avgRating={product.avgRating} reviewCount={product.reviewCount} />
            </div>
          </div>

          <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold-tint to-paper p-5">
            <Price price={product.price} salePrice={product.salePrice} discountPercent={product.discountPercent} size="lg" />
          </div>

          <ProductBuyBox product={product} />

          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper text-sm">
            {POLICIES.map((p) => (
              <li key={p.key} className="px-4 py-3">
                <span className="font-medium text-ink">{p.title}:</span>{" "}
                <span className="text-muted">{p.short}</span>{" "}
                <Link href={POLICY_PAGE[p.key]} className="whitespace-nowrap text-gold-deep underline">Xem chi tiết</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-8 grid gap-6 lg:gap-10 lg:grid-cols-2" aria-labelledby="thong-so">
        <div>
          <h2 id="thong-so" className="mb-4 font-serif text-2xl text-ink">Thông số sản phẩm</h2>
          <table className="w-full text-sm">
            <tbody>
              {specs.map(([k, v]) => (
                <tr key={k} className="border-b border-line">
                  <th scope="row" className="w-2/5 py-2.5 text-left font-normal text-muted">{k}</th>
                  <td className="py-2.5 text-ink">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {product.gemstones.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 font-serif text-xl text-ink">Đá quý</h3>
              <ul className="space-y-3">
                {product.gemstones.map((g) => (
                  <li key={g.id} className="rounded-lg border border-line bg-paper p-4 text-sm">
                    <p className="font-medium text-ink">
                      {g.name}
                      {g.quantity > 1 ? ` x ${g.quantity}` : ""}
                    </p>
                    <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-muted">
                      {g.carat != null && g.carat > 0 && (
                        <>
                          <dt>Trọng lượng</dt>
                          <dd className="text-ink">{g.carat} carat</dd>
                        </>
                      )}
                      {g.color && (
                        <>
                          <dt>Màu sắc</dt>
                          <dd className="text-ink">{g.color}</dd>
                        </>
                      )}
                      {g.clarity && (
                        <>
                          <dt>Độ tinh khiết</dt>
                          <dd className="text-ink">{g.clarity}</dd>
                        </>
                      )}
                      {g.cut && (
                        <>
                          <dt>Kiểu cắt</dt>
                          <dd className="text-ink">{g.cut}</dd>
                        </>
                      )}
                    </dl>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div>
          <h2 className="mb-4 font-serif text-2xl text-ink">Mô tả</h2>
          <p className="whitespace-pre-line leading-relaxed text-muted">
            {product.description || "Chưa có mô tả cho sản phẩm này."}
          </p>
        </div>
      </section>

      <ReviewSection productId={product.id} slug={product.slug} avgRating={product.avgRating} reviewCount={product.reviewCount} />

      {product.related.length > 0 && (
        <section className="mt-10" aria-labelledby="lien-quan">
          <h2 id="lien-quan" className="mb-6 font-serif text-3xl text-ink">Sản phẩm liên quan</h2>
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {product.related.map((p) => (
              <li key={p.id} className="flex">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
