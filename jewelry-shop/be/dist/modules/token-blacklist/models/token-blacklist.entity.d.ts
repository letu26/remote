import { BaseEntity } from '../../../models/base.entity.js';
export declare enum BlacklistScope {
    TOKEN = "token",
    ALL_BEFORE = "all_before"
}
export declare enum BlacklistReason {
    LOGOUT = "logout",
    CHANGE_PASSWORD = "change_password",
    RESET_PASSWORD = "reset_password"
}
export declare class TokenBlacklist extends BaseEntity {
    userId: number;
    scope: BlacklistScope;
    jti: string | null;
    issuedBefore: Date | null;
    reason: BlacklistReason;
    expiresAt: Date;
}
