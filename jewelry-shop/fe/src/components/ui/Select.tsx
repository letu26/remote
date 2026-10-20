import type { SelectHTMLAttributes } from "react";
import { inputClass } from "./Field";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  /** Ẩn nhãn nhưng vẫn giữ cho trình đọc màn hình. */
  hideLabel?: boolean;
}

export function Select({ label, name, options, hideLabel, className = "", ...rest }: Props) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className={hideLabel ? "sr-only" : "block text-sm font-medium text-ink"}>
        {label}
      </label>
      <select id={name} name={name} className={`${inputClass()} ${className}`} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
