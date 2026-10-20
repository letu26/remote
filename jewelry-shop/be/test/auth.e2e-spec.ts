import { createHash, createHmac, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { Redis } from 'ioredis';
import mysql from 'mysql2/promise';
import request from 'supertest';
import { MailService } from '../src/modules/mail/services/mail.service.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

const PASSWORD = 'Secret123';
const runId = Date.now();
let counter = 0;
const nextEmail = () => `e2e-${runId}-${++counter}@e2e.test`;
const nextPhone = () =>
  '0999' + String(Math.floor(Math.random() * 1e6)).padStart(6, '0');

let app: INestApplication;
let db: mysql.Connection;
let http: () => ReturnType<typeof request>;

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
function signJwt(payload: object, secret = process.env.JWT_SECRET as string) {
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64(payload);
  const sig = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}
const decode = (t: string) => JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString());

function newUserBody(over: Record<string, unknown> = {}) {
  return {
    fullName: 'Nguyen Van Test',
    email: nextEmail(),
    phone: nextPhone(),
    password: PASSWORD,
    confirmPassword: PASSWORD,
    acceptTerms: true,
    ...over,
  };
}

async function register(over: Record<string, unknown> = {}) {
  const body = newUserBody(over);
  const res = await request(app.getHttpServer()).post('/api/auth/register').send(body);
  return { body, res };
}
async function login(phone: string, password = PASSWORD) {
  return request(app.getHttpServer()).post('/api/auth/login').send({ phone, password });
}
async function registerAndLogin() {
  const { body, res } = await register();
  expect(res.status).toBe(201);
  const l = await login(body.phone);
  expect(l.status).toBe(200);
  return { body, token: l.body.accessToken as string, user: res.body.user };
}
async function insertUser(role: 'admin' | 'user', status: 'active' | 'locked' = 'active') {
  const email = nextEmail();
  const phone = nextPhone();
  const hash = await bcrypt.hash(PASSWORD, 4);
  const [r] = await db.query<mysql.ResultSetHeader>(
    'INSERT INTO users (fullName,email,phone,passwordHash,role,status) VALUES (?,?,?,?,?,?)',
    ['E2E Seeded', email, phone, hash, role, status],
  );
  return { id: r.insertId, email, phone };
}
const sha = (v: string) => createHash('sha256').update(v).digest('hex');
const KEY = {
  otp: (email: string) => `jewelry:otp:forgot:${sha(email.toLowerCase())}`,
  cooldown: (email: string) => `jewelry:otp:cooldown:${sha(email.toLowerCase())}`,
  reset: (token: string) => `jewelry:reset:${sha(token)}`,
};
let redis: Redis;
const sentOtps = new Map<string, string>(); // OTP bắt được từ MailService giả
const touchedKeys = new Set<string>(); // chỉ xóa đúng các key test đã tạo/đụng tới
const mailStub = {
  sendOtpMail: (to: string, _name: string, otp: string) => {
    sentOtps.set(to.toLowerCase(), otp);
  },
};
function trackEmail(email: string) {
  touchedKeys.add(KEY.otp(email));
  touchedKeys.add(KEY.cooldown(email));
}
function trackReset(token: string) {
  touchedKeys.add(KEY.reset(token));
}
const forgot = (email: string) => {
  trackEmail(email);
  return request(app.getHttpServer()).post('/api/auth/forgot-password').send({ email });
};
const verifyOtp = (email: string, otp: string) =>
  request(app.getHttpServer()).post('/api/auth/verify-otp').send({ email, otp });
async function requestOtp(email: string) {
  const res = await forgot(email);
  expect(res.status).toBe(200);
  const otp = sentOtps.get(email.toLowerCase());
  expect(otp).toMatch(/^\d{6}$/);
  return otp as string;
}
function wrongOtpOf(otp: string) {
  return otp === '111111' ? '222222' : '111111';
}
async function getResetToken(email: string) {
  const otp = await requestOtp(email);
  const res = await verifyOtp(email, otp);
  expect(res.status).toBe(200);
  trackReset(res.body.resetToken);
  return res.body.resetToken as string;
}
/** Ghi thẳng một resetToken vào Redis (không qua OTP). */
async function seedResetToken(userId: number, ttl = 600) {
  const token = randomBytes(32).toString('hex');
  trackReset(token);
  await redis.set(KEY.reset(token), String(userId), 'EX', ttl);
  return token;
}
async function userIdByPhone(phone: string) {
  const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM users WHERE phone=?', [phone]);
  return rows[0].id as number;
}
async function cleanup() {
  await db.query(
    "DELETE FROM token_blacklist WHERE userId IN (SELECT id FROM users WHERE email LIKE '%@e2e.test')",
  );
  await db.query("DELETE FROM users WHERE email LIKE '%@e2e.test'");
  if (redis && touchedKeys.size) await redis.del(...touchedKeys);
}

function expectErrorShape(res: request.Response, status: number, code: string) {
  expect(res.status).toBe(status);
  expect(res.body.statusCode).toBe(status);
  expect(res.body.code).toBe(code);
  expect(typeof res.body.message).toBe('string');
  expect(typeof res.body.timestamp).toBe('string');
  expect(typeof res.body.path).toBe('string');
  expect(JSON.stringify(res.body)).not.toMatch(/stack|passwordHash|at .*\.(ts|js):\d+/i);
}

beforeAll(async () => {
  db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { ca: readFileSync(process.env.DB_SSL_CA as string, 'utf8') } : undefined,
    charset: 'utf8mb4',
  });
  redis = new Redis(process.env.REDIS_URL as string);
  await cleanup();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue(mailStub)
    .compile();
  app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  http = () => request(app.getHttpServer());
}, 60_000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await app?.close();
    await db?.end();
    await redis?.quit().catch(() => undefined);
  }
}, 30_000);

describe('POST /api/auth/register', () => {
  it('thành công, role luôn là user, không trả passwordHash', async () => {
    const { body, res } = await register();
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      role: 'user',
      status: 'active',
    });
    expect(typeof res.body.user.id).toBe('number');
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('client gửi role admin vẫn thành user', async () => {
    const { res } = await register({ role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
  });

  it('email lưu chữ thường', async () => {
    const email = `E2E-${runId}-UPPER@e2e.test`;
    const { res } = await register({ email });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email.toLowerCase());
  });

  it.each([
    ['thiếu fullName', { fullName: undefined }, 'fullName'],
    ['thiếu email', { email: undefined }, 'email'],
    ['thiếu phone', { phone: undefined }, 'phone'],
    ['thiếu password', { password: undefined }, 'password'],
    ['sai định dạng email', { email: 'not-an-email' }, 'email'],
    ['phone không bắt đầu bằng 0', { phone: '1999123456' }, 'phone'],
    ['phone sai độ dài', { phone: '099912345' }, 'phone'],
    ['phone chứa chữ', { phone: '09991234ab' }, 'phone'],
    ['mật khẩu < 6 ký tự', { password: '12345', confirmPassword: '12345' }, 'password'],
    ['fullName 1 ký tự', { fullName: 'A' }, 'fullName'],
    ['confirmPassword không khớp', { confirmPassword: 'Different1' }, 'confirmPassword'],
    ['không tick acceptTerms', { acceptTerms: false }, 'acceptTerms'],
    ['thiếu acceptTerms', { acceptTerms: undefined }, 'acceptTerms'],
  ])('400 VALIDATION_ERROR: %s', async (_n, over, field) => {
    const { res } = await register(over);
    expectErrorShape(res, 400, 'VALIDATION_ERROR');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details.map((d: { field: string }) => d.field)).toContain(field);
  });

  it('trùng email -> 409 EMAIL_ALREADY_EXISTS', async () => {
    const { body } = await register();
    const { res } = await register({ email: body.email });
    expectErrorShape(res, 409, 'EMAIL_ALREADY_EXISTS');
  });

  it('trùng phone -> 409 PHONE_ALREADY_EXISTS', async () => {
    const { body } = await register();
    const { res } = await register({ phone: body.phone });
    expectErrorShape(res, 409, 'PHONE_ALREADY_EXISTS');
  });

  it('hai request song song cùng email/phone chỉ một thành công', async () => {
    const body = newUserBody();
    const results = await Promise.all([
      http().post('/api/auth/register').send(body),
      http().post('/api/auth/register').send(body),
    ]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);
    const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM users WHERE email=?', [body.email]);
    expect(rows.length).toBe(1);
  });
});

describe('POST /api/auth/login', () => {
  it('đúng: token có id/email/role, hết hạn đúng 1 ngày', async () => {
    const { body, res } = await register();
    expect(res.status).toBe(201);
    const l = await login(body.phone);
    expect(l.status).toBe(200);
    expect(l.body.user).toMatchObject({ email: body.email, phone: body.phone, role: 'user' });
    expect(JSON.stringify(l.body)).not.toMatch(/passwordHash/i);
    const p = decode(l.body.accessToken);
    expect(p).toMatchObject({ id: res.body.user.id, email: body.email, role: 'user' });
    expect(String(p.sub)).toBe(String(res.body.user.id));
    expect(p.exp - p.iat).toBe(86400);
  });

  it('sai mật khẩu và sai số điện thoại cùng 401 INVALID_CREDENTIALS, cùng message', async () => {
    const { body } = await register();
    const wrongPass = await login(body.phone, 'WrongPass1');
    const wrongPhone = await login('0999000000'.replace(/0$/, '1') === body.phone ? '0999000002' : '0999000001');
    expectErrorShape(wrongPass, 401, 'INVALID_CREDENTIALS');
    expectErrorShape(wrongPhone, 401, 'INVALID_CREDENTIALS');
    expect(wrongPass.body.message).toBe(wrongPhone.body.message);
    expect(wrongPass.body.message).toBe('Số điện thoại hoặc mật khẩu không đúng');
  });

  it('thiếu trường -> 400 VALIDATION_ERROR', async () => {
    const res = await http().post('/api/auth/login').send({ phone: '0999123456' });
    expectErrorShape(res, 400, 'VALIDATION_ERROR');
  });

  it('tài khoản locked -> 403 ACCOUNT_LOCKED', async () => {
    const u = await insertUser('user', 'locked');
    const res = await login(u.phone);
    expectErrorShape(res, 403, 'ACCOUNT_LOCKED');
  });
});

describe('token', () => {
  it('không có token -> 401', async () => {
    const res = await http().get('/api/users/me');
    expect(res.status).toBe(401);
    expect(['UNAUTHORIZED', 'TOKEN_INVALID']).toContain(res.body.code);
    expectErrorShape(res, 401, res.body.code);
  });

  it('token sai -> 401 TOKEN_INVALID', async () => {
    const res = await http().get('/api/users/me').set('Authorization', 'Bearer abc.def.ghi');
    expectErrorShape(res, 401, 'TOKEN_INVALID');
  });

  it('token ký sai secret -> 401 TOKEN_INVALID', async () => {
    const now = Math.floor(Date.now() / 1000);
    const t = signJwt({ sub: 1, id: 1, email: 'x@e2e.test', role: 'admin', iat: now, exp: now + 3600 }, 'wrong-secret');
    const res = await http().get('/api/admin/ping').set('Authorization', `Bearer ${t}`);
    expectErrorShape(res, 401, 'TOKEN_INVALID');
  });

  it('token hết hạn -> 401 TOKEN_EXPIRED', async () => {
    const { user } = await registerAndLogin();
    const now = Math.floor(Date.now() / 1000);
    const t = signJwt({ sub: user.id, id: user.id, email: user.email, role: 'user', iat: now - 7200, exp: now - 3600 });
    const res = await http().get('/api/users/me').set('Authorization', `Bearer ${t}`);
    expectErrorShape(res, 401, 'TOKEN_EXPIRED');
  });
});

describe('users/me', () => {
  it('GET lấy thông tin', async () => {
    const { body, token } = await registerAndLogin();
    const res = await http().get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ fullName: body.fullName, email: body.email, phone: body.phone, role: 'user', status: 'active' });
    expect(res.body.createdAt).toBeDefined();
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('PATCH sửa fullName/email/phone', async () => {
    const { token } = await registerAndLogin();
    const upd = { fullName: 'Ten Moi', email: nextEmail(), phone: nextPhone() };
    const res = await http().patch('/api/users/me').set('Authorization', `Bearer ${token}`).send(upd);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(upd);
    const me = await http().get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(me.body).toMatchObject(upd);
  });

  it('PATCH không cho đổi role', async () => {
    const { token } = await registerAndLogin();
    const res = await http().patch('/api/users/me').set('Authorization', `Bearer ${token}`).send({ role: 'admin', fullName: 'Van B' });
    expect([200, 400]).toContain(res.status);
    const me = await http().get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.role).toBe('user');
  });

  it('PATCH trùng email người khác -> 409', async () => {
    const a = await registerAndLogin();
    const b = await registerAndLogin();
    const res = await http().patch('/api/users/me').set('Authorization', `Bearer ${b.token}`).send({ email: a.body.email });
    expectErrorShape(res, 409, 'EMAIL_ALREADY_EXISTS');
  });

  it('PATCH trùng phone người khác -> 409', async () => {
    const a = await registerAndLogin();
    const b = await registerAndLogin();
    const res = await http().patch('/api/users/me').set('Authorization', `Bearer ${b.token}`).send({ phone: a.body.phone });
    expectErrorShape(res, 409, 'PHONE_ALREADY_EXISTS');
  });

  it('PATCH giữ nguyên email/phone của chính mình không bị 409', async () => {
    const a = await registerAndLogin();
    const res = await http().patch('/api/users/me').set('Authorization', `Bearer ${a.token}`).send({ email: a.body.email, phone: a.body.phone });
    expect(res.status).toBe(200);
  });

  it('PATCH sai định dạng -> 400', async () => {
    const { token } = await registerAndLogin();
    const res = await http().patch('/api/users/me').set('Authorization', `Bearer ${token}`).send({ phone: '123' });
    expectErrorShape(res, 400, 'VALIDATION_ERROR');
  });

  it('đổi mật khẩu đúng rồi đăng nhập bằng mật khẩu mới', async () => {
    const { body, token } = await registerAndLogin();
    const res = await http()
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: PASSWORD, newPassword: 'NewSecret9', confirmPassword: 'NewSecret9' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Đổi mật khẩu thành công, vui lòng đăng nhập lại');
    // token cũ (kể cả token vừa dùng) bị thu hồi
    const old = await http().get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expectErrorShape(old, 401, 'TOKEN_REVOKED');
    expect((await login(body.phone, PASSWORD)).status).toBe(401);
    const again = await login(body.phone, 'NewSecret9');
    expect(again.status).toBe(200);
    // đăng nhập lại ngay sau khi đổi (cùng giây) vẫn dùng được
    const me = await http().get('/api/users/me').set('Authorization', `Bearer ${again.body.accessToken}`);
    expect(me.status).toBe(200);
  });

  it('đổi mật khẩu vô hiệu MỌI token cũ (đăng nhập 2 lần)', async () => {
    const { body, token } = await registerAndLogin();
    const t2 = (await login(body.phone)).body.accessToken as string;
    const res = await http()
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: PASSWORD, newPassword: 'NewSecret9', confirmPassword: 'NewSecret9' });
    expect(res.status).toBe(200);
    for (const t of [token, t2]) {
      expectErrorShape(await http().get('/api/users/me').set('Authorization', `Bearer ${t}`), 401, 'TOKEN_REVOKED');
    }
  });

  it('sai mật khẩu hiện tại -> 400 VALIDATION_ERROR', async () => {
    const { token } = await registerAndLogin();
    const res = await http()
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Wrong123', newPassword: 'NewSecret9', confirmPassword: 'NewSecret9' });
    expectErrorShape(res, 400, 'VALIDATION_ERROR');
  });

  it('confirm không khớp -> 400 VALIDATION_ERROR', async () => {
    const { token } = await registerAndLogin();
    const res = await http()
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: PASSWORD, newPassword: 'NewSecret9', confirmPassword: 'Other1234' });
    expectErrorShape(res, 400, 'VALIDATION_ERROR');
  });

  it('mật khẩu mới < 6 ký tự -> 400', async () => {
    const { token } = await registerAndLogin();
    const res = await http()
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: PASSWORD, newPassword: '123', confirmPassword: '123' });
    expectErrorShape(res, 400, 'VALIDATION_ERROR');
  });
});

describe('GET /api/admin/ping', () => {
  it('không token -> 401', async () => {
    const res = await http().get('/api/admin/ping');
    expect(res.status).toBe(401);
  });

  it('user thường -> 403 FORBIDDEN', async () => {
    const { token } = await registerAndLogin();
    const res = await http().get('/api/admin/ping').set('Authorization', `Bearer ${token}`);
    expectErrorShape(res, 403, 'FORBIDDEN');
  });

  it('admin -> 200 pong', async () => {
    const admin = await insertUser('admin');
    const l = await login(admin.phone);
    expect(l.status).toBe(200);
    expect(decode(l.body.accessToken).role).toBe('admin');
    const res = await http().get('/api/admin/ping').set('Authorization', `Bearer ${l.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'pong', admin: { id: admin.id, email: admin.email } });
  });
});

describe('POST /api/auth/logout', () => {
  it('không token -> 401', async () => {
    const res = await http().post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('logout thu hồi token đó; token khác của cùng user vẫn dùng được', async () => {
    const { body, token } = await registerAndLogin();
    const other = (await login(body.phone)).body.accessToken as string;
    const out = await http().post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(out.status).toBe(200);
    expect(out.body.message).toBe('Đăng xuất thành công');
    expectErrorShape(await http().get('/api/users/me').set('Authorization', `Bearer ${token}`), 401, 'TOKEN_REVOKED');
    expectErrorShape(await http().post('/api/auth/logout').set('Authorization', `Bearer ${token}`), 401, 'TOKEN_REVOKED');
    expect((await http().get('/api/users/me').set('Authorization', `Bearer ${other}`)).status).toBe(200);
  });
});

describe('tài khoản bị khóa có token hợp lệ', () => {
  it('GET /users/me -> 403 ACCOUNT_LOCKED', async () => {
    const { body, token } = await registerAndLogin();
    await db.query("UPDATE users SET status='locked' WHERE phone=?", [body.phone]);
    const res = await http().get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expectErrorShape(res, 403, 'ACCOUNT_LOCKED');
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('email không tồn tại vẫn 200, trả expiresInSeconds/resendAfterSeconds, không gửi mail', async () => {
    const email = `nobody-${runId}-a@e2e.test`;
    const res = await forgot(email);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Nếu email tồn tại, chúng tôi đã gửi mã OTP',
      expiresInSeconds: 120,
      resendAfterSeconds: 60,
    });
    expect(sentOtps.has(email)).toBe(false);
    expect(await redis.exists(KEY.otp(email))).toBe(0);
    expect(await redis.exists(KEY.cooldown(email))).toBe(1);
  });

  it('cooldown 429 OTP_RATE_LIMITED cho email không tồn tại', async () => {
    const email = `nobody-${runId}-b@e2e.test`;
    expect((await forgot(email)).status).toBe(200);
    const res = await forgot(email);
    expectErrorShape(res, 429, 'OTP_RATE_LIMITED');
    expect(res.body.retryAfterSeconds).toBeGreaterThan(0);
    expect(res.body.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('email sai định dạng -> 400', async () => {
    expectErrorShape(await forgot('abc'), 400, 'VALIDATION_ERROR');
  });

  it('email tồn tại: lưu hash trong Redis (không OTP thô), TTL <= 120, cooldown, cooldown 429', async () => {
    const { body } = await register();
    const otp = await requestOtp(body.email);
    const raw = await redis.get(KEY.otp(body.email));
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string);
    expect(Object.keys(stored).sort()).toEqual(['attempts', 'hash']);
    expect(stored.attempts).toBe(0);
    expect(stored.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(stored.hash).not.toBe(otp);
    const ttl = await redis.ttl(KEY.otp(body.email));
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(120);
    const cd = await redis.ttl(KEY.cooldown(body.email));
    expect(cd).toBeGreaterThan(0);
    expect(cd).toBeLessThanOrEqual(60);
    expectErrorShape(await forgot(body.email), 429, 'OTP_RATE_LIMITED');
  });

  it('tài khoản bị khóa: 200 nhưng không gửi OTP', async () => {
    const u = await insertUser('user', 'locked');
    const res = await forgot(u.email);
    expect(res.status).toBe(200);
    expect(sentOtps.has(u.email)).toBe(false);
    expect(await redis.exists(KEY.otp(u.email))).toBe(0);
  });
});

describe('POST /api/auth/verify-otp', () => {
  it('OTP đúng -> resetToken, OTP bị xóa (dùng một lần)', async () => {
    const { body } = await register();
    const otp = await requestOtp(body.email);
    const res = await verifyOtp(body.email, otp);
    expect(res.status).toBe(200);
    expect(res.body.resetToken).toMatch(/^[0-9a-f]{64}$/);
    expect(res.body.expiresInSeconds).toBe(600);
    trackReset(res.body.resetToken);
    expect(await redis.exists(KEY.otp(body.email))).toBe(0);
    const ttl = await redis.ttl(KEY.reset(res.body.resetToken));
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(600);
    expectErrorShape(await verifyOtp(body.email, otp), 400, 'OTP_EXPIRED');
  });

  it('OTP sai -> 400 OTP_INVALID và đếm số lần sai', async () => {
    const { body } = await register();
    const otp = await requestOtp(body.email);
    expectErrorShape(await verifyOtp(body.email, wrongOtpOf(otp)), 400, 'OTP_INVALID');
    expectErrorShape(await verifyOtp(body.email, wrongOtpOf(otp)), 400, 'OTP_INVALID');
    expect(JSON.parse((await redis.get(KEY.otp(body.email))) as string).attempts).toBe(2);
    // OTP đúng vẫn dùng được khi chưa quá 5 lần sai
    const ok = await verifyOtp(body.email, otp);
    expect(ok.status).toBe(200);
    trackReset(ok.body.resetToken);
  });

  it('5 lần sai -> 429 OTP_TOO_MANY_ATTEMPTS, OTP bị xóa; OTP đúng sau đó -> OTP_EXPIRED', async () => {
    const { body } = await register();
    const otp = await requestOtp(body.email);
    for (const remaining of [4, 3, 2, 1]) {
      const r = await verifyOtp(body.email, wrongOtpOf(otp));
      expectErrorShape(r, 400, 'OTP_INVALID');
      expect(r.body.remainingAttempts).toBe(remaining);
    }
    const last = await verifyOtp(body.email, wrongOtpOf(otp));
    expectErrorShape(last, 429, 'OTP_TOO_MANY_ATTEMPTS');
    expect(last.body).not.toHaveProperty('remainingAttempts');
    expect(await redis.exists(KEY.otp(body.email))).toBe(0);
    expectErrorShape(await verifyOtp(body.email, otp), 400, 'OTP_EXPIRED');
  });

  it('không có OTP / email không tồn tại -> 400 OTP_EXPIRED', async () => {
    const email = `nobody-${runId}-c@e2e.test`;
    trackEmail(email);
    expectErrorShape(await verifyOtp(email, '123456'), 400, 'OTP_EXPIRED');
  });

  it('otp sai định dạng -> 400 VALIDATION_ERROR', async () => {
    const res = await verifyOtp(nextEmail(), '12ab');
    expectErrorShape(res, 400, 'VALIDATION_ERROR');
  });
});

describe('POST /api/auth/reset-password', () => {
  const reset = (resetToken: string, pw = 'Reset1234', confirm = pw) =>
    request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ resetToken, newPassword: pw, confirmPassword: confirm });

  it('luồng đầy đủ forgot -> verify -> reset; dùng lại resetToken bị RESET_TOKEN_INVALID', async () => {
    const { body } = await register();
    const resetToken = await getResetToken(body.email);
    const r1 = await reset(resetToken);
    expect(r1.status).toBe(200);
    expect(r1.body.message).toBe('Đặt lại mật khẩu thành công');
    expect((await login(body.phone, 'Reset1234')).status).toBe(200);
    expect((await login(body.phone, PASSWORD)).status).toBe(401);
    expectErrorShape(await reset(resetToken, 'Another123'), 400, 'RESET_TOKEN_INVALID');
    expect((await login(body.phone, 'Reset1234')).status).toBe(200);
  });

  it('reset vô hiệu MỌI token cũ; đăng nhập lại ngay sau đó dùng được', async () => {
    const { body, token } = await registerAndLogin();
    const t2 = (await login(body.phone)).body.accessToken as string;
    const resetToken = await seedResetToken(await userIdByPhone(body.phone));
    expect((await reset(resetToken)).status).toBe(200);
    for (const t of [token, t2]) {
      expectErrorShape(await http().get('/api/users/me').set('Authorization', `Bearer ${t}`), 401, 'TOKEN_REVOKED');
    }
    const fresh = await login(body.phone, 'Reset1234');
    expect(fresh.status).toBe(200);
    const me = await http().get('/api/users/me').set('Authorization', `Bearer ${fresh.body.accessToken}`);
    expect(me.status).toBe(200);
  });

  it('resetToken hết hạn (key Redis không còn) -> RESET_TOKEN_INVALID', async () => {
    const { body } = await register();
    const token = await seedResetToken(await userIdByPhone(body.phone), 1);
    await new Promise((r) => setTimeout(r, 1500));
    expectErrorShape(await reset(token), 400, 'RESET_TOKEN_INVALID');
  });

  it('resetToken sai -> RESET_TOKEN_INVALID', async () => {
    expectErrorShape(await reset(randomBytes(32).toString('hex')), 400, 'RESET_TOKEN_INVALID');
  });

  it('trường token cũ (token thay vì resetToken) -> 400 VALIDATION_ERROR', async () => {
    const res = await http()
      .post('/api/auth/reset-password')
      .send({ token: 'abc', newPassword: 'Reset1234', confirmPassword: 'Reset1234' });
    expectErrorShape(res, 400, 'VALIDATION_ERROR');
  });

  it('confirm không khớp / mật khẩu ngắn -> 400 VALIDATION_ERROR', async () => {
    expectErrorShape(await reset('abc', 'Reset1234', 'Nope12345'), 400, 'VALIDATION_ERROR');
    expectErrorShape(await reset('abc', '123', '123'), 400, 'VALIDATION_ERROR');
  });

  it('hai request song song cùng một resetToken chỉ một thành công', async () => {
    const { body } = await register();
    const token = await seedResetToken(await userIdByPhone(body.phone));
    const rs = await Promise.all([reset(token, 'Parallel111'), reset(token, 'Parallel222')]);
    expect(rs.map((r) => r.status).sort()).toEqual([200, 400]);
    expect(rs.find((r) => r.status === 400)!.body.code).toBe('RESET_TOKEN_INVALID');
  });
});

describe('định dạng lỗi chung', () => {
  it('route không tồn tại -> 404 NOT_FOUND đúng format', async () => {
    const res = await http().get('/api/khong-ton-tai');
    expectErrorShape(res, 404, 'NOT_FOUND');
    expect(res.body.path).toContain('/api/khong-ton-tai');
  });

  it('JSON hỏng không lộ stack', async () => {
    const res = await http().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.code).toBeDefined();
    expect(JSON.stringify(res.body)).not.toMatch(/stack|node_modules/i);
  });
});
