export function Spinner({ fullScreen = false, label }: { fullScreen?: boolean; label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-muted ${
        fullScreen ? "min-h-screen" : "py-10"
      }`}
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-gold-deep" />
      {label ? <span className="text-sm">{label}</span> : <span className="sr-only">Đang tải</span>}
    </div>
  );
}
