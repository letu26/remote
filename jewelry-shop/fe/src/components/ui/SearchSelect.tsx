"use client";

import { useId, useMemo, useRef, useState } from "react";
import { inputClass } from "./Field";

export interface SearchOption {
  value: string;
  label: string;
}

const plain = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();

const MAX_RENDERED = 100;

/** Lọc không phân biệt hoa thường và dấu tiếng Việt. */
export function filterOptions(options: SearchOption[], text: string): SearchOption[] {
  const q = plain(text.trim());
  return q ? options.filter((o) => plain(o.label).includes(q)) : options;
}

/**
 * Ô chọn có tìm kiếm (combobox): gõ để lọc, mũi tên/Enter để chọn, Esc để đóng.
 * Dùng cho danh sách dài như xã/phường của một tỉnh.
 */
export function SearchSelect({
  label,
  name,
  options,
  value,
  onChange,
  disabled,
  loading,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  error?: string;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null); // null = hiện nhãn của giá trị đang chọn
  const [active, setActive] = useState(0);
  const selected = options.find((o) => o.value === value);
  const shown = text ?? selected?.label ?? "";
  const filtered = useMemo(() => filterOptions(options, text ?? "").slice(0, MAX_RENDERED), [options, text]);

  const choose = (o: SearchOption) => {
    onChange(o.value);
    setText(null);
    setOpen(false);
  };

  return (
    <div className="relative space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        ref={input}
        id={name}
        name={name}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        aria-activedescendant={open && filtered[active] ? `${listId}-${filtered[active].value}` : undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder={loading ? "Đang tải..." : placeholder}
        value={shown}
        className={inputClass(!!error)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Chọn bằng chuột chạy trước blur nhờ onMouseDown; ở đây chỉ đóng và bỏ chữ đang gõ dở.
          setOpen(false);
          setText(null);
        }}
        onChange={(e) => {
          setText(e.target.value);
          setActive(0);
          setOpen(true);
          if (value) onChange("");
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && open && filtered[active]) {
            e.preventDefault();
            choose(filtered[active]);
          } else if (e.key === "Escape" && open) {
            e.stopPropagation();
            setOpen(false);
            setText(null);
          }
        }}
      />
      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`Danh sách ${label}`}
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-ui border border-line-strong bg-paper py-1 text-sm shadow-pop"
        >
          {loading ? (
            <li className="px-3.5 py-2 text-muted">Đang tải...</li>
          ) : filtered.length === 0 ? (
            <li className="px-3.5 py-2 text-muted">Không tìm thấy kết quả</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.value}
                id={`${listId}-${o.value}`}
                role="option"
                aria-selected={o.value === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-3.5 py-2 ${i === active ? "bg-gold-tint" : ""} ${o.value === value ? "font-semibold text-gold-deeper" : "text-ink"}`}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
      {error && (
        <p id={`${name}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
