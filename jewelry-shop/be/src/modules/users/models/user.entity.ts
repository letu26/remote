import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 100 })
  fullName: string;

  @Index({ unique: true })
  @Column({ length: 150 })
  email: string;

  @Index({ unique: true })
  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;
}
