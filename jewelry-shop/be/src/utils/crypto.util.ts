import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, BCRYPT_ROUNDS);
export const verifyPassword = (plain: string, hash: string): Promise<boolean> => bcrypt.compare(plain, hash);

/** Hash giả để so sánh khi không có user, giữ thời gian phản hồi gần như nhau. */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

export const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

export const hmacSha256 = (secret: string, value: string): string =>
  createHmac('sha256', secret).update(value).digest('hex');

/** So sánh hai chuỗi hex cùng độ dài theo thời gian không đổi. */
export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

/** OTP 6 chữ số sinh bằng CSPRNG. */
export const generateOtp = (): string => randomInt(0, 1_000_000).toString().padStart(6, '0');
export const generateResetToken = (): string => randomBytes(32).toString('hex');
