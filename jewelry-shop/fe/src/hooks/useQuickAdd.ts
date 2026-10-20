"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { getProduct } from "@/services/product.service";
import { addToCart } from "@/store/cart-store";
import { cartErrorMessage } from "@/utils/cart-errors";
import { notify } from "@/utils/notify";
import { useRequireLogin } from "./useRequireLogin";

/**
 * Thêm nhanh từ thẻ sản phẩm. Danh sách chưa có thông tin biến thể nên lấy chi tiết khi bấm:
 * đúng một biến thể thì thêm thẳng, nhiều biến thể thì chuyển sang trang chi tiết để chọn size.
 */
export interface QuickAddTarget {
  slug: string;
  name: string;
  variantCount?: number;
  singleVariantId?: number | null;
}

export function useQuickAdd() {
  const router = useRouter();
  const requireLogin = useRequireLogin();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  const quickAdd = async ({ slug, name, variantCount, singleVariantId }: QuickAddTarget) => {
    if (lock.current || !requireLogin()) return;
    // Danh sách đã cho biết số biến thể: không cần gọi lại chi tiết sản phẩm.
    if (variantCount === 0) {
      notify("error", "Sản phẩm này đã hết hàng");
      return;
    }
    if (variantCount !== undefined && variantCount > 1) {
      notify("info", "Vui lòng chọn size trước khi thêm vào giỏ");
      router.push(`/products/${slug}`);
      return;
    }
    if (variantCount === 1 && typeof singleVariantId === "number") {
      lock.current = true;
      setBusy(true);
      try {
        await addToCart(singleVariantId, 1);
        notify("success", `Đã thêm "${name}" vào giỏ hàng`);
      } catch (err) {
        notify("error", cartErrorMessage(err));
      } finally {
        lock.current = false;
        setBusy(false);
      }
      return;
    }
    // Backend cũ chưa trả variantCount: lấy chi tiết để biết số biến thể.
    lock.current = true;
    setBusy(true);
    try {
      const detail = await getProduct(slug);
      if (!detail) {
        notify("error", "Không tìm thấy sản phẩm này");
        return;
      }
      const variants = detail.variants.filter((v) => v.stock > 0);
      if (detail.variants.length === 1 && variants.length === 1) {
        await addToCart(variants[0].id, 1);
        notify("success", `Đã thêm "${name}" vào giỏ hàng`);
      } else if (variants.length === 0) {
        notify("error", "Sản phẩm này đã hết hàng");
      } else {
        notify("info", "Vui lòng chọn size trước khi thêm vào giỏ");
        router.push(`/products/${slug}`);
      }
    } catch (err) {
      notify("error", cartErrorMessage(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return { quickAdd, busy };
}
