import type { CustomerRole, CustomerStatus } from "@/types/admin-customer";

export interface CustomerActionState {
  canLock: boolean;
  canUnlock: boolean;
  canChangeRole: boolean;
  /** Vai trò sẽ đặt khi bấm Đổi quyền. */
  nextRole: CustomerRole;
  /** Lý do nút bị vô hiệu hóa (hiển thị gợi ý). */
  lockHint: string | null;
  roleHint: string | null;
}

/**
 * Quy tắc hiển thị nút: không khóa hoặc đổi quyền chính mình, không khóa tài khoản admin.
 * Mở khóa tài khoản nào cũng được. Server vẫn kiểm tra lại.
 */
export function customerActions(
  customer: { id: number; role: CustomerRole; status: CustomerStatus },
  selfId: number | null,
): CustomerActionState {
  const isSelf = selfId !== null && customer.id === selfId;
  const locked = customer.status === "locked";
  let lockHint: string | null = null;
  if (!locked) {
    if (isSelf) lockHint = "Không thể tự khóa chính mình";
    else if (customer.role === "admin") lockHint = "Không thể khóa tài khoản quản trị viên";
  }
  return {
    canLock: !locked && lockHint === null,
    canUnlock: locked,
    canChangeRole: !isSelf,
    nextRole: customer.role === "admin" ? "user" : "admin",
    lockHint,
    roleHint: isSelf ? "Không thể tự đổi quyền của chính mình" : null,
  };
}

export const ROLE_LABEL: Record<CustomerRole, string> = { user: "Khách hàng", admin: "Quản trị viên" };
export const STATUS_LABEL: Record<CustomerStatus, string> = { active: "Đang hoạt động", locked: "Đã khóa" };
