import { AlertIcon } from "./Icons";
import { Button } from "./Button";

export function ErrorState({
  title = "Không tải được dữ liệu",
  description = "Đã có lỗi xảy ra, vui lòng thử lại.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-lg border border-danger/30 bg-danger/5 px-5 py-8 text-center"
    >
      <span className="mb-4 text-danger">
        <AlertIcon width={36} height={36} />
      </span>
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
