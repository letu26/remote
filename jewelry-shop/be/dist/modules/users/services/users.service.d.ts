import type { ChangePasswordDto, UpdateProfileDto, UserResponse } from '../dtos/user.dtos.js';
import { User } from '../models/user.entity.js';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import { UserRepository } from '../repositories/user.repository.js';
export interface RegisterInput {
    fullName: string;
    email: string;
    phone: string;
    password: string;
}
export declare function toUserResponse(user: User): UserResponse;
export declare class UsersService {
    private readonly users;
    private readonly tokenBlacklist;
    private readonly logger;
    constructor(users: UserRepository, tokenBlacklist: TokenBlacklistService);
    createUser(input: RegisterInput): Promise<User>;
    getProfile(userId: number): Promise<UserResponse>;
    updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserResponse>;
    changePassword(userId: number, dto: ChangePasswordDto): Promise<void>;
    private assertNoConflict;
    private translateDuplicate;
    private phoneExists;
    private emailExists;
}
