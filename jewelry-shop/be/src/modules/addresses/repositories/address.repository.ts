import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, type EntityManager } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';

export interface AddressView {
  id: number;
  receiverName: string;
  receiverPhone: string;
  provinceId: number;
  provinceName: string;
  wardId: number;
  wardName: string;
  detail: string;
  isDefault: boolean;
}

export interface AddressFields {
  receiverName: string;
  receiverPhone: string;
  provinceId: number;
  wardId: number;
  detail: string;
}

export type CreateAddressResult = { ok: true; id: number } | { ok: false; reason: 'limit' };

interface RawAddress extends Omit<AddressView, 'isDefault'> {
  isDefault: number;
}

const SELECT_VIEW = `
  SELECT a.id, a.receiverName, a.receiverPhone, a.provinceId, p.name AS provinceName,
         a.wardId, w.name AS wardName, a.detail, a.isDefault
  FROM addresses a
  JOIN provinces p ON p.id = a.provinceId
  JOIN wards w ON w.id = a.wardId`;

const toView = (row: RawAddress): AddressView => ({ ...row, isDefault: toBool(row.isDefault) });

/** Mọi truy vấn đều lọc theo userId. Ghi nhiều bước khóa dòng user trong transaction để đếm/cờ mặc định nhất quán. */
@Injectable()
export class AddressRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findAll(userId: number): Promise<AddressView[]> {
    const rows: RawAddress[] = await this.dataSource.query(
      `${SELECT_VIEW} WHERE a.userId = ? ORDER BY a.isDefault DESC, a.createdAt ASC, a.id ASC`,
      [userId],
    );
    return rows.map(toView);
  }

  async findOne(userId: number, id: number): Promise<AddressView | null> {
    const rows: RawAddress[] = await this.dataSource.query(`${SELECT_VIEW} WHERE a.userId = ? AND a.id = ?`, [userId, id]);
    return rows[0] ? toView(rows[0]) : null;
  }

  /** Xã/phường có thuộc tỉnh/thành không (cả hai phải tồn tại). */
  async wardBelongsToProvince(wardId: number, provinceId: number): Promise<boolean> {
    const rows: unknown[] = await this.dataSource.query(
      'SELECT 1 FROM wards WHERE id = ? AND provinceId = ? LIMIT 1',
      [wardId, provinceId],
    );
    return rows.length > 0;
  }

  create(userId: number, fields: AddressFields, wantDefault: boolean, maxAddresses: number): Promise<CreateAddressResult> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockUser(manager, userId);
      const count = await this.count(manager, userId);
      if (count >= maxAddresses) return { ok: false, reason: 'limit' } as const;

      const makeDefault = count === 0 || wantDefault;
      // Chỉ bỏ cờ cũ khi đã có địa chỉ: UPDATE trên khoảng rỗng của chỉ mục userId sẽ khóa gap và gây deadlock
      // giữa các người dùng khác nhau cùng tạo địa chỉ đầu tiên.
      if (makeDefault && count > 0) await manager.query('UPDATE addresses SET isDefault = 0 WHERE userId = ?', [userId]);
      const result: { insertId: number } = await manager.query(
        `INSERT INTO addresses (userId, receiverName, receiverPhone, provinceId, wardId, detail, isDefault)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, fields.receiverName, fields.receiverPhone, fields.provinceId, fields.wardId, fields.detail, makeDefault ? 1 : 0],
      );
      return { ok: true, id: result.insertId } as const;
    });
  }

  update(userId: number, id: number, fields: Partial<AddressFields>, makeDefault: boolean): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockUser(manager, userId);
      const sets = Object.keys(fields).map((key) => `${key} = ?`);
      if (sets.length) {
        // Tên cột lấy từ khóa của DTO đã whitelist, không phải input thô.
        await manager.query(`UPDATE addresses SET ${sets.join(', ')} WHERE id = ? AND userId = ?`, [
          ...Object.values(fields),
          id,
          userId,
        ]);
      }
      if (makeDefault) await this.setDefault(manager, userId, id);
    });
  }

  makeDefault(userId: number, id: number): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockUser(manager, userId);
      await this.setDefault(manager, userId, id);
    });
  }

  /** Xóa địa chỉ; nếu là mặc định thì địa chỉ tạo gần nhất còn lại lên thay. Trả false nếu không có địa chỉ. */
  remove(userId: number, id: number): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockUser(manager, userId);
      const rows: { isDefault: number }[] = await manager.query(
        'SELECT isDefault FROM addresses WHERE id = ? AND userId = ?',
        [id, userId],
      );
      if (!rows.length) return false;
      await manager.query('DELETE FROM addresses WHERE id = ? AND userId = ?', [id, userId]);
      if (toBool(rows[0].isDefault)) {
        await manager.query(
          'UPDATE addresses SET isDefault = 1 WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1',
          [userId],
        );
      }
      return true;
    });
  }

  private async lockUser(manager: EntityManager, userId: number): Promise<void> {
    await manager.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
  }

  private async count(manager: EntityManager, userId: number): Promise<number> {
    const rows: { total: string }[] = await manager.query('SELECT COUNT(*) AS total FROM addresses WHERE userId = ?', [userId]);
    return Number(rows[0]?.total ?? 0);
  }

  private async setDefault(manager: EntityManager, userId: number, id: number): Promise<void> {
    await manager.query('UPDATE addresses SET isDefault = (id = ?) WHERE userId = ?', [id, userId]);
  }
}
