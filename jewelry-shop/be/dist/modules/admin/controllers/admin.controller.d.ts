import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
export declare class AdminController {
    ping(user: AuthenticatedUser): {
        message: string;
        admin: {
            id: number;
            email: string;
        };
    };
}
