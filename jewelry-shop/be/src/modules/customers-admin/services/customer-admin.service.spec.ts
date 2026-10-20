import { describe, expect, it, vi } from 'vitest';
import type { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import { UserRole, UserStatus } from '../../users/models/user.entity.js';
import type { CustomerAdminRepository, CustomerRow, RoleChangeTransaction } from '../repositories/customer-admin.repository.js';
import { CustomerAdminService } from './customer-admin.service.js';

const user = (id: number, role: UserRole, status = UserStatus.ACTIVE): CustomerRow => ({
  id,
  fullName: `U${id}`,
  phone: `090000000${id}`,
  email: `u${id}@test`,
  role,
  status,
  createdAt: new Date(),
});

/** Dựng service với repo giả: withRoleChange chạy `work` trên transaction giả. */
function build(target: CustomerRow, activeAdminIds: number[]) {
  const setRole = vi.fn().mockResolvedValue(undefined);
  const revoke = vi.fn().mockResolvedValue(undefined);
  const repo = {
    findById: vi.fn().mockResolvedValue(target),
    findStats: vi.fn().mockResolvedValue(new Map()),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    withRoleChange: vi.fn(async (_id: number, work: (tx: RoleChangeTransaction) => Promise<unknown>) =>
      work({ target, activeAdminIds, setRole, handle: {} as never }),
    ),
  };
  const service = new CustomerAdminService(
    repo as unknown as CustomerAdminRepository,
    { revokeAllInTransaction: revoke } as unknown as TokenBlacklistService,
  );
  return { service, repo, setRole, revoke };
}

describe('CustomerAdminService.updateRole', () => {
  it('không tự đổi quyền của chính mình', async () => {
    const { service, repo } = build(user(1, UserRole.ADMIN), [1, 2]);
    await expect(service.updateRole(1, 1, { role: UserRole.USER })).rejects.toMatchObject({ code: 'CANNOT_MODIFY_SELF' });
    expect(repo.withRoleChange).not.toHaveBeenCalled();
  });

  it('LAST_ADMIN: không hạ quyền admin hoạt động cuối cùng', async () => {
    const { service, setRole, revoke } = build(user(2, UserRole.ADMIN), [2]);
    await expect(service.updateRole(1, 2, { role: UserRole.USER })).rejects.toMatchObject({ code: 'LAST_ADMIN' });
    expect(setRole).not.toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
  });

  it('hạ quyền được khi còn admin khác, đồng thời thu hồi token cũ trong cùng transaction', async () => {
    const { service, setRole, revoke } = build(user(2, UserRole.ADMIN), [1, 2]);
    await service.updateRole(1, 2, { role: UserRole.USER });
    expect(setRole).toHaveBeenCalledWith(UserRole.USER);
    expect(revoke).toHaveBeenCalledOnce();
  });

  it('hạ quyền admin đang bị khóa không bị tính vào LAST_ADMIN', async () => {
    const { service, setRole } = build(user(3, UserRole.ADMIN, UserStatus.LOCKED), [1]);
    await service.updateRole(1, 3, { role: UserRole.USER });
    expect(setRole).toHaveBeenCalledOnce();
  });

  it('nâng user lên admin thu hồi token cũ; đặt lại cùng quyền thì không đổi gì', async () => {
    const promote = build(user(4, UserRole.USER), [1]);
    await promote.service.updateRole(1, 4, { role: UserRole.ADMIN });
    expect(promote.setRole).toHaveBeenCalledWith(UserRole.ADMIN);
    expect(promote.revoke).toHaveBeenCalledOnce();

    const same = build(user(4, UserRole.USER), [1]);
    await same.service.updateRole(1, 4, { role: UserRole.USER });
    expect(same.setRole).not.toHaveBeenCalled();
    expect(same.revoke).not.toHaveBeenCalled();
  });

  it('404 khi tài khoản không tồn tại', async () => {
    const { service, repo } = build(user(5, UserRole.USER), [1]);
    repo.withRoleChange.mockResolvedValueOnce(null);
    await expect(service.updateRole(1, 5, { role: UserRole.ADMIN })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('CustomerAdminService.updateStatus', () => {
  it('không tự khóa mình, không khóa admin', async () => {
    const self = build(user(1, UserRole.ADMIN), [1]);
    await expect(self.service.updateStatus(1, 1, { status: UserStatus.LOCKED })).rejects.toMatchObject({ code: 'CANNOT_MODIFY_SELF' });
    const admin = build(user(2, UserRole.ADMIN), [1, 2]);
    await expect(admin.service.updateStatus(1, 2, { status: UserStatus.LOCKED })).rejects.toMatchObject({ code: 'CANNOT_LOCK_ADMIN' });
  });

  it('khóa user thường; đặt lại cùng giá trị vẫn thành công và không ghi lại', async () => {
    const lock = build(user(3, UserRole.USER), [1]);
    await lock.service.updateStatus(1, 3, { status: UserStatus.LOCKED });
    expect(lock.repo.updateStatus).toHaveBeenCalledWith(3, UserStatus.LOCKED);

    const same = build(user(3, UserRole.USER, UserStatus.LOCKED), [1]);
    await same.service.updateStatus(1, 3, { status: UserStatus.LOCKED });
    expect(same.repo.updateStatus).not.toHaveBeenCalled();
  });

  it('mở khóa tài khoản admin được phép', async () => {
    const unlock = build(user(2, UserRole.ADMIN, UserStatus.LOCKED), [1]);
    await unlock.service.updateStatus(1, 2, { status: UserStatus.ACTIVE });
    expect(unlock.repo.updateStatus).toHaveBeenCalledWith(2, UserStatus.ACTIVE);
  });
});
