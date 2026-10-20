import { ChevronIcon } from "./Icons";

/** Rút gọn danh sách trang: 1 … 4 5 6 … 10 */
function pageList(page: number, total: number): (number | "gap")[] {
  const set = new Set([1, total, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

const item =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-ui border px-2 text-sm transition-colors";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        aria-label="Trang trước"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={`${item} border-line-strong bg-paper text-ink hover:bg-gold-tint disabled:opacity-40`}
      >
        <ChevronIcon dir="left" width={16} height={16} />
      </button>
      {pageList(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Trang ${p}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPageChange(p)}
            className={`${item} ${
              p === page
                ? "border-gold-deep bg-gold-deep text-white"
                : "border-line-strong bg-paper text-ink hover:bg-gold-tint"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Trang sau"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={`${item} border-line-strong bg-paper text-ink hover:bg-gold-tint disabled:opacity-40`}
      >
        <ChevronIcon dir="right" width={16} height={16} />
      </button>
    </nav>
  );
}
