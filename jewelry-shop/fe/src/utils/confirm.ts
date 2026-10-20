export interface ConfirmOptions {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "default";
}

/**
 * Hộp xác nhận dùng chung (SweetAlert2). Nạp thư viện bằng dynamic import khi cần,
 * nên không nằm trong bundle chính và an toàn với SSR/prerender.
 */
export async function confirmAction(options: ConfirmOptions): Promise<boolean> {
  const { title, text, confirmText = "Xác nhận", cancelText = "Hủy", tone = "default" } = options;
  const danger = tone === "danger";
  const { default: Swal } = await import("sweetalert2");
  const result = await Swal.fire({
    title,
    text,
    icon: danger ? "warning" : "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: danger,
    // Thao tác xóa: không đóng khi bấm ra ngoài, vẫn cho Esc.
    allowOutsideClick: !danger,
    allowEscapeKey: true,
    buttonsStyling: false,
    customClass: {
      popup: "swal-popup",
      title: "swal-title",
      htmlContainer: "swal-text",
      actions: "swal-actions",
      confirmButton: `swal-btn ${danger ? "swal-btn-danger" : "swal-btn-primary"}`,
      cancelButton: "swal-btn swal-btn-ghost",
      icon: danger ? "swal-icon-warning" : "swal-icon-question",
    },
  });
  return result.isConfirmed;
}

export interface ReasonOptions {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  maxLength?: number;
}

/** Xác nhận kèm ô nhập lý do (tùy chọn). Trả về `{ confirmed, reason }`. */
export async function confirmWithReason(options: ReasonOptions): Promise<{ confirmed: boolean; reason: string }> {
  const { title, text, confirmText = "Xác nhận", cancelText = "Hủy", placeholder = "Lý do (không bắt buộc)", maxLength = 255 } = options;
  const { default: Swal } = await import("sweetalert2");
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    input: "textarea",
    inputPlaceholder: placeholder,
    inputAttributes: { maxlength: String(maxLength), "aria-label": "Lý do" },
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
    allowOutsideClick: false,
    allowEscapeKey: true,
    buttonsStyling: false,
    customClass: {
      popup: "swal-popup",
      title: "swal-title",
      htmlContainer: "swal-text",
      actions: "swal-actions",
      confirmButton: "swal-btn swal-btn-danger",
      cancelButton: "swal-btn swal-btn-ghost",
      icon: "swal-icon-warning",
    },
  });
  return { confirmed: result.isConfirmed, reason: typeof result.value === "string" ? result.value.trim() : "" };
}
