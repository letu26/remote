export interface ConfirmNoteOptions {
  title: string;
  text?: string;
  confirmText: string;
  tone?: "danger" | "default";
  placeholder?: string;
}

/** Hộp xác nhận (SweetAlert2) có ô ghi chú tùy chọn. Trả về null nếu hủy, ngược lại là ghi chú (có thể rỗng). */
export async function confirmWithNote(options: ConfirmNoteOptions): Promise<string | null> {
  const { title, text, confirmText, tone = "default", placeholder = "Ghi chú (tùy chọn)" } = options;
  const danger = tone === "danger";
  const { default: Swal } = await import("sweetalert2");
  const result = await Swal.fire({
    title,
    text,
    icon: danger ? "warning" : "question",
    input: "textarea",
    inputPlaceholder: placeholder,
    inputAttributes: { maxlength: "255", "aria-label": "Ghi chú" },
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Đóng",
    reverseButtons: true,
    focusCancel: danger,
    allowOutsideClick: !danger,
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
  return result.isConfirmed ? String(result.value ?? "").trim() : null;
}
