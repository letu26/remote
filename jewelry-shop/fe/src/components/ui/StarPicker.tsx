"use client";

import { useRef, type KeyboardEvent } from "react";
import { StarIcon } from "./Icons";

/**
 * Bộ chọn 1..5 sao dạng radiogroup: Tab vào nhóm, mũi tên/Home/End đổi giá trị, chuột chọn trực tiếp.
 * Mỗi sao có nhãn "N sao" cho trình đọc màn hình.
 */
export function StarPicker({
  value,
  onChange,
  disabled,
  invalid,
  labelledBy,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  invalid?: boolean;
  labelledBy?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  // Tab dừng ở sao đang chọn, chưa chọn thì ở sao đầu tiên.
  const tabStop = value >= 1 ? value : 1;

  const move = (next: number) => {
    const n = Math.min(5, Math.max(1, next));
    onChange(n);
    refs.current[n - 1]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, n: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      move(n + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      move(n - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      move(1);
    } else if (e.key === "End") {
      e.preventDefault();
      move(5);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : "Chọn số sao"}
      aria-invalid={invalid}
      className="inline-flex gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          ref={(el) => {
            refs.current[n - 1] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} sao`}
          tabIndex={n === tabStop ? 0 : -1}
          disabled={disabled}
          onClick={() => onChange(n)}
          onKeyDown={(e) => onKeyDown(e, n)}
          className="rounded-ui p-0.5 text-gold transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep disabled:opacity-50"
        >
          <StarIcon width={28} height={28} filled={n <= value} />
        </button>
      ))}
    </div>
  );
}
