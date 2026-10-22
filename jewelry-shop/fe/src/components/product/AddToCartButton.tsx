"use client";

import { Button } from "@/components/ui/Button";
import { CartIcon } from "@/components/ui/Icons";
import { useQuickAdd } from "@/hooks/useQuickAdd";

/** Nút thêm nhanh trên thẻ sản phẩm (một biến thể: thêm thẳng; nhiều biến thể: sang trang chi tiết). */
export function AddToCartButton({
  slug,
  name,
  variantCount,
  singleVariantId,
  disabled,
  compact = false,
}: {
  slug: string;
  name: string;
  variantCount?: number;
  singleVariantId?: number | null;
  disabled?: boolean;
  compact?: boolean;
}) {
  const { quickAdd, busy } = useQuickAdd();
  return (
    <Button
      variant="secondary"
      size={compact ? "sm" : "md"}
      disabled={disabled || variantCount === 0}
      loading={busy}
      aria-label={`Thêm ${name} vào giỏ hàng`}
      onClick={() => quickAdd({ slug, name, variantCount, singleVariantId })}
    >
      <CartIcon width={16} height={16} />
      {compact ? <span className="sr-only">Thêm giỏ</span> : "Thêm vào giỏ hàng"}
    </Button>
  );
}
