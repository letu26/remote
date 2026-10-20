import { BaseEntity } from '../../../models/base.entity.js';
export declare enum UserRole {
    ADMIN = "admin",
    USER = "user"
}
export declare enum UserStatus {
    ACTIVE = "active",
    LOCKED = "locked"
}
export declare class User extends BaseEntity {
    fullName: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
}
