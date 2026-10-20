import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User, UserRole } from '../models/user.entity.js';

export interface NewUserData {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
}

@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findByPhoneWithPassword(phone: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.phone = :phone', { phone })
      .getOne();
  }

  findByIdWithPassword(id: number): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id })
      .getOne();
  }

  /** Tìm user (khác excludeId) trùng email hoặc phone; chỉ lấy cột cần dùng. */
  findConflicts(email: string | undefined, phone: string | undefined, excludeId?: number): Promise<User[]> {
    const where = [
      ...(email ? [{ email, ...(excludeId ? { id: Not(excludeId) } : {}) }] : []),
      ...(phone ? [{ phone, ...(excludeId ? { id: Not(excludeId) } : {}) }] : []),
    ];
    if (!where.length) return Promise.resolve([]);
    return this.repo.find({ select: { id: true, email: true, phone: true }, where });
  }

  create(data: NewUserData): Promise<User> {
    return this.repo.save(this.repo.create(data));
  }

  async updateProfile(id: number, data: Partial<Pick<User, 'fullName' | 'email' | 'phone'>>): Promise<void> {
    if (Object.keys(data).length) await this.repo.update({ id }, data);
  }
}
