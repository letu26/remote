import { JwtService } from '@nestjs/jwt';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import type { UserResponse } from '../../users/dtos/user.dtos.js';
import { UserRepository } from '../../users/repositories/user.repository.js';
import { UsersService } from '../../users/services/users.service.js';
import type { LoginDto, RegisterDto } from '../dtos/auth.dtos.js';
import type { AuthenticatedUser } from '../models/jwt-payload.js';
export declare class AuthService {
    private readonly usersService;
    private readonly users;
    private readonly jwtService;
    private readonly tokenBlacklist;
    private readonly logger;
    constructor(usersService: UsersService, users: UserRepository, jwtService: JwtService, tokenBlacklist: TokenBlacklistService);
    register(dto: RegisterDto): Promise<{
        user: UserResponse;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: Omit<UserResponse, 'status' | 'createdAt'>;
    }>;
    logout(user: AuthenticatedUser): Promise<{
        message: string;
    }>;
}
