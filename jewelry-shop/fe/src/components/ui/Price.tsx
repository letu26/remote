import { formatVND } from "@/utils/format";

/** Giá gốc gạch ngang, giá khuyến mại và % giảm. Không có khuyến mại thì chỉ hiện giá bán. */
export function Price({
  price,
  salePrice,
  discountPercent,
  size = "md",
}: {
  price: number;
  salePrice?: number | null;
  discountPercent?: number | null;
  size?: "md" | "lg";
}) {
  const main = size === "lg" ? "text-2xl sm:text-3xl" : "text-base";
  if (!salePrice || salePrice >= price) {
    return <span className={`font-semibold text-ink ${main}`}>{formatVND(price)}</span>;
  }
  return (
    <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
      <span className={`font-semibold text-sale ${main}`}>{formatVND(salePrice)}</span>
      <del className="text-sm text-muted">{formatVND(price)}</del>
      {discountPercent ? (
        <span className="text-xs font-semibold text-sale">-{discountPercent}%</span>
      ) : null}
    </span>
  );
}
