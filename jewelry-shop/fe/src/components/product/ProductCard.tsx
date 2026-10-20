import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { Rating } from "@/components/ui/Rating";
import type { ProductSummary } from "@/types/catalog";
import { artFor } from "@/utils/product-art";
import { AddToCartButton } from "./AddToCartButton";
import { ProductImage } from "./ProductImage";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ product }: { product: ProductSummary }) {
  const soldOut = !product.inStock;
  const href = `/products/${product.slug}`;
  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-line bg-paper shadow-card transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-pop">
      <div className="relative aspect-square overflow-hidden bg-sand">
        <Link href={href} tabIndex={-1} aria-hidden>
          <div className="relative h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.03]">
            <ProductImage
              url={product.primaryImageUrl}
              alt={product.name}
              art={artFor(product.category.slug)}
              metal="vang"
              variant={product.id % 4}
              sizes="(min-width: 1280px) 20rem, (min-width: 640px) 33vw, 50vw"
            />
          </div>
        </Link>
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {product.discountPercent ? <Badge tone="sale">-{product.discountPercent}%</Badge> : null}
          {soldOut && <Badge tone="soldout">Hết hàng</Badge>}
        </div>
        <WishlistButton productId={product.id} name={product.name} className="absolute right-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="text-xs tracking-wide text-muted">Mã: {product.code}</p>
        <h3 className="line-clamp-2 font-serif text-base leading-snug text-ink">
          <Link href={href} className="hover:text-gold-deep">
            {product.name}
          </Link>
        </h3>
        {product.reviewCount > 0 ? (
          <Rating value={product.avgRating} count={product.reviewCount} size={14} />
        ) : (
          <p className="text-xs text-muted">Chưa có đánh giá</p>
        )}
        <Price price={product.price} salePrice={product.salePrice} discountPercent={product.discountPercent} />
        <p className={`text-xs ${soldOut ? "text-danger" : "text-success"}`}>
          {soldOut ? "Hết hàng" : "Còn hàng"}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1.5">
          <ButtonLink href={href} variant="primary" size="sm" className="flex-1">
            Xem chi tiết
          </ButtonLink>
          <AddToCartButton slug={product.slug} name={product.name} variantCount={product.variantCount} singleVariantId={product.singleVariantId} disabled={soldOut} compact />
        </div>
      </div>
    </article>
  );
}
