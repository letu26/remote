import { beforeEach, describe, expect, it, vi } from "vitest";

const fire = vi.fn();
vi.mock("sweetalert2", () => ({ default: { fire: (...a: unknown[]) => fire(...a) } }));

import { confirmAction } from "./confirm";

beforeEach(() => fire.mockReset());

describe("confirmAction", () => {
  it("tone danger: icon cảnh báo, focus Hủy, đảo nút, không đóng khi bấm ngoài, cho Esc", async () => {
    fire.mockResolvedValue({ isConfirmed: true });
    await expect(confirmAction({ title: "Xóa", tone: "danger", confirmText: "Xóa" })).resolves.toBe(true);
    expect(fire.mock.calls[0][0]).toMatchObject({
      icon: "warning",
      focusCancel: true,
      reverseButtons: true,
      allowOutsideClick: false,
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      buttonsStyling: false,
    });
    expect(fire.mock.calls[0][0].customClass.confirmButton).toContain("swal-btn-danger");
  });
  it("mặc định: nút Xác nhận/Hủy, cho đóng khi bấm ngoài", async () => {
    fire.mockResolvedValue({ isConfirmed: false });
    await expect(confirmAction({ title: "Ẩn?" })).resolves.toBe(false);
    expect(fire.mock.calls[0][0]).toMatchObject({
      icon: "question",
      focusCancel: false,
      allowOutsideClick: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    });
  });
});
