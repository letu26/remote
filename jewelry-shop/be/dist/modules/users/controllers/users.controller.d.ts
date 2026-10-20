import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { ChangePasswordDto, UpdateProfileDto, type UserResponse } from '../dtos/user.dtos.js';
import { UsersService } from '../services/users.service.js';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: AuthenticatedUser): Promise<UserResponse>;
    updateMe(user: AuthenticatedUser, dto: UpdateProfileDto): Promise<UserResponse>;
    changePassword(user: AuthenticatedUser, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
