import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
const BCRYPT_ROUNDS = 10;
export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const hmacSha256 = (secret, value) => createHmac('sha256', secret).update(value).digest('hex');
export function safeEqualHex(a, b) {
    const left = Buffer.from(a, 'hex');
    const right = Buffer.from(b, 'hex');
    return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}
export const generateOtp = () => randomInt(0, 1_000_000).toString().padStart(6, '0');
export const generateResetToken = () => randomBytes(32).toString('hex');
//# sourceMappingURL=crypto.util.js.map