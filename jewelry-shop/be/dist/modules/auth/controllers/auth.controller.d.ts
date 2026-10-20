import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, VerifyOtpDto } from '../dtos/auth.dtos.js';
import type { AuthenticatedUser } from '../models/jwt-payload.js';
import { AuthService } from '../services/auth.service.js';
import { PasswordRecoveryService } from '../services/password-recovery.service.js';
export declare class AuthController {
    private readonly authService;
    private readonly recoveryService;
    constructor(authService: AuthService, recoveryService: PasswordRecoveryService);
    register(dto: RegisterDto): Promise<{
        user: import("../../users/dtos/user.dtos.js").UserResponse;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: Omit<import("../../users/dtos/user.dtos.js").UserResponse, "status" | "createdAt">;
    }>;
    logout(user: AuthenticatedUser): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
        expiresInSeconds: number;
        resendAfterSeconds: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        resetToken: string;
        expiresInSeconds: number;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
