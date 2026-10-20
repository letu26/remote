import { StarIcon } from "./Icons";

export function Rating({
  value,
  count,
  size = 16,
}: {
  value: number;
  count?: number;
  size?: number;
}) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        role="img"
        aria-label={`Đánh giá ${value.toFixed(1)} trên 5 sao`}
        className="inline-flex text-gold"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} width={size} height={size} filled={n <= rounded} />
        ))}
      </span>
      {count !== undefined && <span className="text-xs text-muted">({count})</span>}
    </span>
  );
}
