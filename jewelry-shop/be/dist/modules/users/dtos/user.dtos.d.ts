import type { UserRole, UserStatus } from '../models/user.entity.js';
export declare const PHONE_REGEX: RegExp;
export declare class UpdateProfileDto {
    fullName?: string;
    email?: string;
    phone?: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
export interface UserResponse {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
}
