import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-gold-deep text-white hover:bg-gold-deeper font-semibold",
  // "outline" giữ lại như bí danh của "secondary" cho code cũ.
  secondary: "border border-gold-deep text-gold-deep hover:bg-gold-tint font-medium",
  outline: "border border-gold-deep text-gold-deep hover:bg-gold-tint font-medium",
  ghost: "text-muted hover:text-ink hover:bg-sand font-medium",
};
const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs max-sm:min-h-9",
  md: "px-4 py-2 text-sm min-h-9",
  lg: "px-6 py-2.5 text-sm min-h-10",
};

/** Class dùng chung cho nút và liên kết dạng nút. */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-xl tracking-wide transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${extra}`;
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
