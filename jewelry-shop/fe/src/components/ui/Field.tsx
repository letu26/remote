import type { InputHTMLAttributes, ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

export const inputClass = (error?: boolean) =>
  `w-full rounded-ui border bg-paper px-3 py-2 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted/60 focus:border-gold-deep focus:ring-2 focus:ring-gold/30 disabled:bg-sand ${
    error ? "border-danger" : "border-line-strong"
  }`;

export function Field({ label, name, error, className = "", ...rest }: Props) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`${inputClass(!!error)} ${className}`}
        {...rest}
      />
      {error && (
        <p id={`${name}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Alert({
  kind = "error",
  children,
}: {
  kind?: "error" | "success";
  children: ReactNode;
}) {
  if (!children) return null;
  const color =
    kind === "error"
      ? "border-danger/40 bg-danger/5 text-danger"
      : "border-success/40 bg-success/5 text-success";
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-ui border px-3 py-2 text-sm ${color}`}>
      {children}
    </div>
  );
}
