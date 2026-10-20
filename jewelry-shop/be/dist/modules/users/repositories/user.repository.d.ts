import { Repository } from 'typeorm';
import { User, UserRole } from '../models/user.entity.js';
export interface NewUserData {
    fullName: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: UserRole;
}
export declare class UserRepository {
    private readonly repo;
    constructor(repo: Repository<User>);
    findById(id: number): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByPhoneWithPassword(phone: string): Promise<User | null>;
    findByIdWithPassword(id: number): Promise<User | null>;
    findConflicts(email: string | undefined, phone: string | undefined, excludeId?: number): Promise<User[]>;
    create(data: NewUserData): Promise<User>;
    updateProfile(id: number, data: Partial<Pick<User, 'fullName' | 'email' | 'phone'>>): Promise<void>;
}
