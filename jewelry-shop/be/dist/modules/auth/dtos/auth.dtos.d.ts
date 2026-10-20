export declare class RegisterDto {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
}
export declare class LoginDto {
    phone: string;
    password: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class VerifyOtpDto {
    email: string;
    otp: string;
}
export declare class ResetPasswordDto {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
}
