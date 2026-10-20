import type { UserRole } from '../../users/models/user.entity.js';
export interface JwtPayload {
    sub: number;
    id: number;
    email: string;
    role: UserRole;
    jti: string;
    iatMs: number;
    exp?: number;
}
export interface AuthenticatedUser {
    id: number;
    email: string;
    role: UserRole;
    jti: string;
    iatMs: number;
    exp: number;
}
