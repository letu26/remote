export declare const hashPassword: (plain: string) => Promise<string>;
export declare const verifyPassword: (plain: string, hash: string) => Promise<boolean>;
export declare const DUMMY_PASSWORD_HASH: string;
export declare const sha256: (value: string) => string;
export declare const hmacSha256: (secret: string, value: string) => string;
export declare function safeEqualHex(a: string, b: string): boolean;
export declare const generateOtp: () => string;
export declare const generateResetToken: () => string;
