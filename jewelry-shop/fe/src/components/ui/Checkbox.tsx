import type { InputHTMLAttributes, ReactNode } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export function Checkbox({ label, className = "", ...rest }: Props) {
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 text-sm text-ink ${className}`}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#8c6a1c]" {...rest} />
      <span>{label}</span>
    </label>
  );
}
