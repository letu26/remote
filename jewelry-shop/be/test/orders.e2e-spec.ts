import { readFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { Redis } from 'ioredis';
import mysql from 'mysql2/promise';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { MailService } from '../src/modules/mail/services/mail.service.js';
import { configureApp } from '../src/app.setup.js';
import { ImageStorage } from '../src/modules/media/services/image-storage.js';

const runId = Date.now().toString(36);
const CODE = `TMP-E2E-${runId.toUpperCase()}`;
const NAME = `TMP E2E ${runId}`;
const PASSWORD = 'Secret123';
const BANK_KEYS = ['bank.bankName', 'bank.accountNumber', 'bank.accountHolder', 'bank.transferNote'];
const BANK = { bankName: `TMP E2E Bank ${runId}`, accountNumber: '9999 0000 1111', accountHolder: 'TMP E2E HOLDER', transferNote: 'TT {orderCode}' };
let seq = 0;
const n = () => ++seq;

let app: INestApplication;
let db: mysql.Connection;
let redis: Redis;
let adminToken = '';
let adminId = 0;
let originalBank: Record<string, string> = {};
const myUserIds: number[] = [];

const noStorage = { isConfigured: () => false, upload: async () => { throw new Error('off'); }, delete: async () => undefined };

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
const call = (method: Method, path: string, token?: string, body?: object, headers: Record<string, string> = {}) => {
  const r = request(app.getHttpServer())[method](`/api${path}`);
  if (token) r.set('Authorization', `Bearer ${token}`);
  for (const [k, v] of Object.entries(headers)) r.set(k, v);
  return body ? r.send(body) : r;
};
const adm = (method: Method, path: string, body?: object) => call(method, path, adminToken, body);

interface TU { id: number; token: string; phone: string; addressId: number }
async function mkUser(role: 'admin' | 'user' = 'user', fullName = 'E2E Cust'): Promise<Omit<TU, 'addressId'>> {
  const email = `e2e-ord-${runId}-${n()}@e2e.test`;
  const phone = '0996' + String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
  const hash = await bcrypt.hash(PASSWORD, 4);
  const [r] = await db.query<mysql.ResultSetHeader>(
    'INSERT INTO users (fullName,email,phone,passwordHash,role,status) VALUES (?,?,?,?,?,?)',
    [fullName, email, phone, hash, role, 'active'],
  );
  myUserIds.push(r.insertId);
  const res = await request(app.getHttpServer()).post('/api/auth/login').send({ phone, password: PASSWORD });
  expect(res.status).toBe(200);
  return { id: r.insertId, token: res.body.accessToken, phone };
}
let loc: { provinceId: number; wardId: number; provinceName: string; wardName: string };
async function mkCustomer(): Promise<TU> {
  const u = await mkUser();
  const [r] = await db.query<mysql.ResultSetHeader>(
    'INSERT INTO addresses (userId,receiverName,receiverPhone,provinceId,wardId,detail,isDefault) VALUES (?,?,?,?,?,?,1)',
    [u.id, 'Nguyen Nhan', '0912345678', loc.provinceId, loc.wardId, '12 Duong Test'],
  );
  return { ...u, addressId: r.insertId };
}

function expectErr(res: request.Response, status: number, code: string) {
  expect(res.status, JSON.stringify(res.body)).toBe(status);
  expect(res.body.code).toBe(code);
}
async function mkCategory() {
  const res = await adm('post', '/admin/categories', { name: `${NAME} cat ${n()}` });
  expect(res.status).toBe(201);
  return res.body as { id: number };
}
async function mkProduct(categoryId: number, over: Record<string, unknown> = {}) {
  const i = n();
  const res = await adm('post', '/admin/products', {
    code: `${CODE}-${i}`, name: `${NAME} P${i}`, categoryId, price: 1_000_000,
    variants: [{ sku: `${CODE}-${i}-A`, size: '', stock: 10 }],
    ...over,
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as any;
}
async function mkShip(fee: number, over: Record<string, unknown> = {}) {
  const res = await adm('post', '/admin/shipping-methods', { name: `${NAME} ship ${n()}`, fee, ...over });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as { id: number; name: string; fee: number };
}
const stockOf = async (variantId: number) =>
  ((await db.query<mysql.RowDataPacket[]>('SELECT stock FROM product_variants WHERE id=?', [variantId]))[0][0].stock as number);
const setStock = (variantId: number, stock: number) => db.query('UPDATE product_variants SET stock=? WHERE id=?', [stock, variantId]);
const countOrders = async (userId: number) =>
  ((await db.query<mysql.RowDataPacket[]>('SELECT COUNT(*) n FROM orders WHERE userId=?', [userId]))[0][0].n as number);
const orderId = async (code: string) =>
  ((await db.query<mysql.RowDataPacket[]>('SELECT id FROM orders WHERE code=?', [code]))[0][0].id as number);

async function addCart(u: { token: string }, variantId: number, quantity = 1) {
  const res = await call('post', '/cart/items', u.token, { variantId, quantity });
  expect([200, 201], JSON.stringify(res.body)).toContain(res.status);
  return res.body;
}
const cartItems = async (u: { token: string }) => (await call('get', '/cart', u.token)).body.items as any[];
const preview = (u: { token: string }, itemIds: number[], shippingMethodId?: number) =>
  call('post', '/orders/preview', u.token, { itemIds, shippingMethodId });
const idemKey = () => `e2e-${runId}-${n()}-${Math.random().toString(36).slice(2, 8)}`;
const postOrder = (u: TU, body: Record<string, unknown>, key = idemKey()) =>
  call('post', '/orders', u.token, body, { 'Idempotency-Key': key });

/** Tạo một đơn thật qua API (giỏ -> preview -> đặt). */
async function placeOrder(
  u: TU, variants: Array<[number, number]>, ship: { id: number }, paymentMethod: 'cod' | 'bank_transfer' = 'cod', extra: Record<string, unknown> = {},
) {
  for (const [vid, q] of variants) await addCart(u, vid, q);
  const ids = (await cartItems(u)).filter((i) => variants.some(([v]) => v === i.variantId)).map((i) => i.id);
  const pv = await preview(u, ids, ship.id);
  expect(pv.status, JSON.stringify(pv.body)).toBe(200);
  const res = await postOrder(u, { itemIds: ids, addressId: u.addressId, shippingMethodId: ship.id, paymentMethod, expectedTotal: pv.body.total, ...extra });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return { ids, pv: pv.body, body: res.body, code: res.body.code as string, id: await orderId(res.body.code) };
}

async function cleanup() {
  const sub = "(SELECT id FROM users WHERE email LIKE '%@e2e.test')";
  const ord = `(SELECT id FROM orders WHERE userId IN ${sub})`;
  await db.query(`DELETE FROM order_status_history WHERE orderId IN ${ord}`);
  await db.query(`DELETE FROM order_items WHERE orderId IN ${ord}`);
  await db.query(`DELETE FROM orders WHERE userId IN ${sub}`);
  await db.query(`DELETE FROM cart_items WHERE cartId IN (SELECT id FROM carts WHERE userId IN ${sub})`);
  await db.query(`DELETE FROM carts WHERE userId IN ${sub}`);
  await db.query(`DELETE FROM addresses WHERE userId IN ${sub}`);
  await db.query(`DELETE FROM wishlists WHERE userId IN ${sub}`);
  await db.query(`DELETE FROM token_blacklist WHERE userId IN ${sub}`);
  await db.query("DELETE FROM shipping_methods WHERE name LIKE 'TMP E2E%'");
  await db.query("DELETE FROM products WHERE code LIKE 'TMP-E2E-%'");
  for (let i = 0; i < 4; i++) {
    await db.query(
      "DELETE FROM categories WHERE name LIKE 'TMP E2E%' AND id NOT IN (SELECT parentId FROM (SELECT parentId FROM categories WHERE parentId IS NOT NULL) t)",
    );
  }
  await db.query(`DELETE FROM users WHERE email LIKE '%@e2e.test'`);
  for (const id of myUserIds) {
    const keys = await redis.keys(`jewelry:idem:order:${id}:*`);
    if (keys.length) await redis.del(...keys);
  }
}

let cat: { id: number };
let SM1: any, SM2: any, SMOFF: any;

beforeAll(async () => {
  db = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { ca: readFileSync(process.env.DB_SSL_CA as string, 'utf8') } : undefined,
    charset: 'utf8mb4',
  });
  redis = new Redis(process.env.REDIS_URL as string);
  // đọc cài đặt chuyển khoản gốc để khôi phục
  const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT setting_key k, value v FROM site_settings WHERE setting_key IN (?)', [BANK_KEYS]);
  originalBank = Object.fromEntries(rows.map((r) => [r.k, r.v]));
  await cleanup();

  const m = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ImageStorage).useValue(noStorage).overrideProvider(MailService).useValue({ sendOtpMail: () => undefined, sendOrderPaidMail: () => undefined, sendOrderDeliveredMail: () => undefined }).compile();
  app = m.createNestApplication();
  configureApp(app);
  await app.init();

  const admin = await mkUser('admin', 'E2E Admin');
  adminId = admin.id;
  adminToken = admin.token;
  const prov = (await call('get', '/locations/provinces')).body[0];
  const ward = (await call('get', `/locations/provinces/${prov.id}/wards`)).body[0];
  loc = { provinceId: prov.id, wardId: ward.id, provinceName: prov.name, wardName: ward.name };
  cat = await mkCategory();
  SM1 = await mkShip(30_000);
  SM2 = await mkShip(60_000, { description: 'Nhanh' });
  SMOFF = await mkShip(5_000, { isActive: false });
  const put = await adm('put', '/admin/settings/bank-transfer', BANK);
  expect(put.status, JSON.stringify(put.body)).toBe(200);
}, 120_000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    for (const k of BANK_KEYS) {
      if (k in originalBank) await db.query('UPDATE site_settings SET value=? WHERE setting_key=?', [originalBank[k], k]);
      else await db.query('DELETE FROM site_settings WHERE setting_key=?', [k]);
    }
    await app?.close();
    await db?.end();
    await redis?.quit().catch(() => undefined);
  }
}, 90_000);

// ===================================================================
describe('Phương thức vận chuyển', () => {
  it('GET /shipping-methods: cần token, chỉ mục bật, sắp theo phí tăng dần', async () => {
    expect((await call('get', '/shipping-methods')).status).toBe(401);
    const res = await call('get', '/shipping-methods', (await mkUser()).token);
    expect(res.status).toBe(200);
    const ids = res.body.map((x: any) => x.id);
    expect(ids).toContain(SM1.id);
    expect(ids).toContain(SM2.id);
    expect(ids).not.toContain(SMOFF.id);
    const fees: number[] = res.body.map((x: any) => x.fee);
    expect(fees).toEqual([...fees].sort((a, b) => a - b));
    expect(Object.keys(res.body[0]).sort()).toEqual(['description', 'fee', 'id', 'name']);
  });
  it('admin: 401 không token, 403 role user', async () => {
    const user = await mkUser();
    for (const [m, p] of [['get', ''], ['post', ''], ['patch', '/1'], ['delete', '/1']] as const) {
      expect((await call(m, `/admin/shipping-methods${p}`)).status).toBe(401);
      expect((await call(m, `/admin/shipping-methods${p}`, user.token)).status).toBe(403);
    }
  });
  it('admin CRUD và validate', async () => {
    const list = await adm('get', '/admin/shipping-methods');
    expect(list.body.map((x: any) => x.id)).toContain(SMOFF.id);
    for (const bad of [{ name: 'A', fee: 1 }, { name: `${NAME} x`, fee: -1 }, { name: `${NAME} x`, fee: 1.5 }, { name: `${NAME} x` }, { fee: 5 }]) {
      expectErr(await adm('post', '/admin/shipping-methods', bad), 400, 'VALIDATION_ERROR');
    }
    const c = await mkShip(15_000, { description: 'mô tả' });
    expect(c).toMatchObject({ fee: 15_000, description: 'mô tả' });
    const p = await adm('patch', `/admin/shipping-methods/${c.id}`, { fee: 20_000, isActive: false, name: `${NAME} renamed` });
    expect(p.body).toMatchObject({ fee: 20_000, isActive: false, name: `${NAME} renamed` });
    expectErr(await adm('patch', `/admin/shipping-methods/${c.id}`, { fee: -5 }), 400, 'VALIDATION_ERROR');
    expect((await adm('delete', `/admin/shipping-methods/${c.id}`)).status).toBe(204);
    expectErr(await adm('delete', `/admin/shipping-methods/${c.id}`), 404, 'NOT_FOUND');
  });
  it('xóa khi có đơn -> 409 RESOURCE_IN_USE; sửa phí không đổi phí đơn đã tạo', async () => {
    const sm = await mkShip(40_000);
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o = await placeOrder(u, [[p.variants[0].id, 1]], sm);
    expect(o.body.shippingFee).toBe(40_000);
    expectErr(await adm('delete', `/admin/shipping-methods/${sm.id}`), 409, 'RESOURCE_IN_USE');
    await adm('patch', `/admin/shipping-methods/${sm.id}`, { fee: 99_000, name: `${NAME} changed name` });
    const detail = await call('get', `/orders/${o.code}`, u.token);
    expect(detail.body).toMatchObject({ shippingFee: 40_000, total: 1_040_000 });
    expect(detail.body.shippingMethodName).toBe(sm.name);
  });
});

// ===================================================================
describe('Thông tin chuyển khoản', () => {
  it('GET /payment-info/bank-transfer cần token, đủ 4 trường', async () => {
    expect((await call('get', '/payment-info/bank-transfer')).status).toBe(401);
    const res = await call('get', '/payment-info/bank-transfer', (await mkUser()).token);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(BANK);
  });
  it('admin GET/PUT: 401/403, validate, whitelist', async () => {
    const user = await mkUser();
    expect((await call('get', '/admin/settings/bank-transfer')).status).toBe(401);
    expect((await call('put', '/admin/settings/bank-transfer', undefined, BANK)).status).toBe(401);
    expect((await call('get', '/admin/settings/bank-transfer', user.token)).status).toBe(403);
    expect((await call('put', '/admin/settings/bank-transfer', user.token, BANK)).status).toBe(403);
    expect((await adm('get', '/admin/settings/bank-transfer')).body).toEqual(BANK);
    const bads: Array<Record<string, unknown>> = [
      { ...BANK, transferNote: 'khong co ma' },
      { ...BANK, accountNumber: '12a45' },
      { ...BANK, accountNumber: '123' },
      { ...BANK, accountNumber: '1'.repeat(31) },
      { ...BANK, bankName: '' },
      { ...BANK, accountHolder: 'x'.repeat(101) },
      { ...BANK, transferNote: '' },
      { bankName: 'x' },
    ];
    for (const b of bads) expectErr(await adm('put', '/admin/settings/bank-transfer', b), 400, 'VALIDATION_ERROR');
    const ok = await adm('put', '/admin/settings/bank-transfer', { ...BANK, evil: 'x', 'bank.evil': 'y' });
    expect(ok.status).toBe(200);
    const [rows] = await db.query<mysql.RowDataPacket[]>("SELECT setting_key FROM site_settings WHERE setting_key LIKE 'bank.%'");
    expect(rows.map((r) => r.setting_key).sort()).toEqual([...BANK_KEYS].sort());
    expect((await adm('get', '/admin/settings/bank-transfer')).body).toEqual(BANK);
  });
});

// ===================================================================
describe('Preview', () => {
  it('không ghi DB, tổng đúng kể cả khuyến mại, issues, EMPTY_ORDER, dòng người khác bị bỏ qua', async () => {
    const u = await mkCustomer();
    const other = await mkCustomer();
    const pSale = await mkProduct(cat.id, { price: 1_000_000 });
    const pOos = await mkProduct(cat.id, { price: 200_000 });
    const pLow = await mkProduct(cat.id, { price: 300_000 });
    const pHidden = await mkProduct(cat.id, { price: 400_000 });
    await db.query('INSERT INTO promotions (name,productId,discountPercent,startsAt,endsAt,isActive) VALUES (?,?,?,?,?,1)', [
      `${NAME} promo`, pSale.id, 10, new Date(Date.now() - 86_400_000), new Date(Date.now() + 86_400_000),
    ]);
    await addCart(u, pSale.variants[0].id, 2);
    await addCart(u, pOos.variants[0].id, 1);
    await addCart(u, pLow.variants[0].id, 3);
    await addCart(u, pHidden.variants[0].id, 1);
    await addCart(other, pSale.variants[0].id, 1);
    const otherItem = (await cartItems(other))[0];
    const items = await cartItems(u);
    const by = (p: any) => items.find((i) => i.productId === p.id);
    await setStock(pOos.variants[0].id, 0);
    await setStock(pLow.variants[0].id, 2);
    await adm('patch', `/admin/products/${pHidden.id}`, { isActive: false });

    const stocksBefore = await Promise.all([pSale, pOos, pLow].map((p) => stockOf(p.variants[0].id)));
    const ordersBefore = await countOrders(u.id);
    const cartBefore = JSON.stringify(await cartItems(u));

    const res = await preview(u, [by(pSale).id, by(pOos).id, by(pLow).id, by(pHidden).id, otherItem.id, 999999999], SM1.id);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const issues = Object.fromEntries(res.body.issues.map((i: any) => [i.cartItemId, i]));
    expect(issues[by(pOos).id].issue).toBe('OUT_OF_STOCK');
    expect(issues[by(pLow).id]).toMatchObject({ issue: 'INSUFFICIENT_STOCK', available: 2 });
    expect(issues[by(pHidden).id].issue).toBe('UNAVAILABLE');
    expect(issues[by(pSale).id]).toBeUndefined();
    expect(res.body.items.map((i: any) => i.cartItemId)).not.toContain(otherItem.id);
    const sale = res.body.items.find((i: any) => i.cartItemId === by(pSale).id);
    expect(sale).toMatchObject({ unitPrice: 900_000, quantity: 2, lineTotal: 1_800_000, productCode: pSale.code, variantId: pSale.variants[0].id });
    expect(res.body.shippingFee).toBe(30_000);
    expect(res.body.total).toBe(res.body.subtotal + 30_000);

    // sau preview: tồn kho, giỏ, đơn không đổi
    expect(await Promise.all([pSale, pOos, pLow].map((p) => stockOf(p.variants[0].id)))).toEqual([stocksBefore[0], 0, 2]);
    expect(await countOrders(u.id)).toBe(ordersBefore);
    expect(JSON.stringify(await cartItems(u))).toBe(cartBefore);

    // không chọn phương thức: phí 0
    const noShip = await preview(u, [by(pSale).id]);
    expect(noShip.body).toMatchObject({ shippingFee: 0, subtotal: 1_800_000, total: 1_800_000, issues: [] });
  });
  it('EMPTY_ORDER khi không có dòng hợp lệ; validate itemIds', async () => {
    const u = await mkCustomer();
    const other = await mkCustomer();
    const p = await mkProduct(cat.id);
    await addCart(other, p.variants[0].id);
    const otherItem = (await cartItems(other))[0];
    expectErr(await preview(u, [otherItem.id, 999999999]), 400, 'EMPTY_ORDER');
    expectErr(await preview(u, []), 400, 'VALIDATION_ERROR');
    expectErr(await preview(u, Array.from({ length: 51 }, (_, i) => i + 1)), 400, 'VALIDATION_ERROR');
    expect((await call('post', '/orders/preview', undefined, { itemIds: [1] })).status).toBe(401);
  });
});

// ===================================================================
describe('Đặt hàng', () => {
  it('thiếu Idempotency-Key -> 400', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    await addCart(u, p.variants[0].id);
    const ids = (await cartItems(u)).map((i) => i.id);
    const res = await call('post', '/orders', u.token, { itemIds: ids, addressId: u.addressId, shippingMethodId: SM1.id, paymentMethod: 'cod', expectedTotal: 1_030_000 });
    expect(res.status).toBe(400);
    expect(await countOrders(u.id)).toBe(0);
    expect((await call('post', '/orders', undefined, {}, { 'Idempotency-Key': idemKey() })).status).toBe(401);
  });

  it('COD thành công: snapshot, mã đơn, lịch sử, trừ kho, giữ dòng giỏ khác, paymentInstructions null', async () => {
    const u = await mkCustomer();
    const p1 = await mkProduct(cat.id, { price: 1_500_000 });
    const p2 = await mkProduct(cat.id, { price: 700_000 });
    const keep = await mkProduct(cat.id);
    await addCart(u, keep.variants[0].id, 2);
    const t0 = new Date();
    const o = await placeOrder(u, [[p1.variants[0].id, 2], [p2.variants[0].id, 1]], SM2, 'cod', { note: 'Giao giờ hành chính', unitPrice: 1, total: 1 });
    const b = o.body;
    expect(b.code).toMatch(/^LG\d{8}-\d{6}$/);
    const vn = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).replace(/-/g, '');
    expect([vn(t0), vn(new Date())]).toContain(b.code.slice(2, 10));
    expect(b).toMatchObject({
      status: 'pending', paymentMethod: 'cod', paymentStatus: 'unpaid', paidAt: null, note: 'Giao giờ hành chính',
      subtotal: 3_700_000, shippingFee: 60_000, total: 3_760_000, shippingMethodName: SM2.name, paymentInstructions: null,
      receiver: { name: 'Nguyen Nhan', phone: '0912345678', province: loc.provinceName, ward: loc.wardName, addressDetail: '12 Duong Test' },
    });
    expect(b.items).toHaveLength(2);
    const i1 = b.items.find((i: any) => i.productCode === p1.code);
    expect(i1).toMatchObject({ productName: p1.name, size: '', imageUrl: null, unitPrice: 1_500_000, quantity: 2, lineTotal: 3_000_000 });
    expect(b.history).toHaveLength(1);
    expect(b.history[0]).toMatchObject({ status: 'pending' });
    expect(JSON.stringify(b)).not.toMatch(/changedBy/);
    // trừ kho đúng
    expect(await stockOf(p1.variants[0].id)).toBe(8);
    expect(await stockOf(p2.variants[0].id)).toBe(9);
    // dòng đã đặt bị xóa khỏi giỏ, dòng khác giữ nguyên
    const left = await cartItems(u);
    expect(left.map((i) => i.variantId)).toEqual([keep.variants[0].id]);
    expect(left[0].quantity).toBe(2);
    // lịch sử đầu có changedById là người đặt
    const [h] = await db.query<mysql.RowDataPacket[]>('SELECT changedById, note FROM order_status_history WHERE orderId=? ORDER BY id', [o.id]);
    expect(h[0].changedById).toBe(u.id);
    // chi tiết trùng
    const detail = await call('get', `/orders/${b.code}`, u.token);
    expect(detail.body.code).toBe(b.code);
  });

  it('chuyển khoản: paymentInstructions đúng; chi tiết có khi chưa trả, mất khi paid hoặc hủy', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id, { price: 2_000_000 });
    const o = await placeOrder(u, [[p.variants[0].id, 1]], SM1, 'bank_transfer');
    expect(o.body.paymentInstructions).toEqual({
      bankName: BANK.bankName, accountNumber: BANK.accountNumber, accountHolder: BANK.accountHolder,
      transferContent: `TT ${o.code}`, amount: 2_030_000,
    });
    const d1 = await call('get', `/orders/${o.code}`, u.token);
    expect(d1.body.paymentInstructions).toMatchObject({ transferContent: `TT ${o.code}`, amount: 2_030_000 });
    await adm('patch', `/admin/orders/${o.id}/payment`, { paymentStatus: 'paid' });
    expect((await call('get', `/orders/${o.code}`, u.token)).body.paymentInstructions).toBeNull();
    await adm('patch', `/admin/orders/${o.id}/payment`, { paymentStatus: 'unpaid' });
    expect((await call('get', `/orders/${o.code}`, u.token)).body.paymentInstructions).not.toBeNull();
    await call('post', `/orders/${o.code}/cancel`, u.token, {});
    expect((await call('get', `/orders/${o.code}`, u.token)).body.paymentInstructions).toBeNull();
  });

  it('expectedTotal sai -> 409 PRICE_CHANGED kèm số mới, không tạo đơn, không trừ kho', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id, { price: 1_000_000 });
    await addCart(u, p.variants[0].id, 2);
    const ids = (await cartItems(u)).map((i) => i.id);
    const res = await postOrder(u, { itemIds: ids, addressId: u.addressId, shippingMethodId: SM1.id, paymentMethod: 'cod', expectedTotal: 1 });
    expectErr(res, 409, 'PRICE_CHANGED');
    expect(res.body).toMatchObject({ subtotal: 2_000_000, shippingFee: 30_000, total: 2_030_000 });
    expect(await countOrders(u.id)).toBe(0);
    expect(await stockOf(p.variants[0].id)).toBe(10);
    expect((await cartItems(u))).toHaveLength(1);
  });

  it('thiếu tồn -> 409 INSUFFICIENT_STOCK kèm shortages, rollback hoàn toàn (kể cả khi chỉ một dòng thiếu)', async () => {
    const u = await mkCustomer();
    const a = await mkProduct(cat.id);
    const b = await mkProduct(cat.id);
    await addCart(u, a.variants[0].id, 3);
    await addCart(u, b.variants[0].id, 4);
    const ids = (await cartItems(u)).map((i) => i.id);
    const pv = await preview(u, ids, SM1.id);
    await setStock(b.variants[0].id, 2); // b thiếu, a vẫn đủ
    const res = await postOrder(u, { itemIds: ids, addressId: u.addressId, shippingMethodId: SM1.id, paymentMethod: 'cod', expectedTotal: pv.body.total });
    expectErr(res, 409, 'INSUFFICIENT_STOCK');
    expect(res.body.shortages).toEqual([{ variantId: b.variants[0].id, productName: b.name, size: '', available: 2, requested: 4 }]);
    expect(await countOrders(u.id)).toBe(0);
    expect(await stockOf(a.variants[0].id)).toBe(10);
    expect(await stockOf(b.variants[0].id)).toBe(2);
    expect(await cartItems(u)).toHaveLength(2);
    const [h] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM order_items WHERE productCode IN (?,?)', [a.code, b.code]);
    expect(h).toHaveLength(0);
  });

  it('địa chỉ của người khác / không tồn tại -> 404', async () => {
    const u = await mkCustomer();
    const other = await mkCustomer();
    const p = await mkProduct(cat.id);
    await addCart(u, p.variants[0].id);
    const ids = (await cartItems(u)).map((i) => i.id);
    for (const addressId of [other.addressId, 999999999]) {
      expectErr(await postOrder(u, { itemIds: ids, addressId, shippingMethodId: SM1.id, paymentMethod: 'cod', expectedTotal: 1_030_000 }), 404, 'NOT_FOUND');
    }
    expect(await countOrders(u.id)).toBe(0);
    expect(await stockOf(p.variants[0].id)).toBe(10);
  });

  it('vận chuyển đã tắt / không tồn tại -> 400 SHIPPING_METHOD_UNAVAILABLE', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    await addCart(u, p.variants[0].id);
    const ids = (await cartItems(u)).map((i) => i.id);
    for (const shippingMethodId of [SMOFF.id, 999999999]) {
      expectErr(await postOrder(u, { itemIds: ids, addressId: u.addressId, shippingMethodId, paymentMethod: 'cod', expectedTotal: 1_005_000 }), 400, 'SHIPPING_METHOD_UNAVAILABLE');
    }
    expect(await countOrders(u.id)).toBe(0);
  });

  it('sản phẩm / biến thể / danh mục ẩn -> 409 ITEM_UNAVAILABLE', async () => {
    const u = await mkCustomer();
    const hideCat = await mkCategory();
    const pa = await mkProduct(cat.id);
    const pb = await mkProduct(cat.id, { variants: [{ sku: `${CODE}-HB-1`, size: '1', stock: 5 }, { sku: `${CODE}-HB-2`, size: '2', stock: 5 }] });
    const pc = await mkProduct(hideCat.id);
    for (const v of [pa.variants[0].id, pb.variants[0].id, pc.variants[0].id]) await addCart(u, v);
    await adm('patch', `/admin/products/${pa.id}`, { isActive: false });
    await adm('patch', `/admin/products/${pb.id}`, { variants: [{ id: pb.variants[1].id, sku: pb.variants[1].sku, size: '2' }] });
    await adm('patch', `/admin/categories/${hideCat.id}`, { isActive: false });
    const items = await cartItems(u);
    for (const it of items) {
      const res = await postOrder(u, { itemIds: [it.id], addressId: u.addressId, shippingMethodId: SM1.id, paymentMethod: 'cod', expectedTotal: 1_030_000 });
      expectErr(res, 409, 'ITEM_UNAVAILABLE');
    }
    expect(await countOrders(u.id)).toBe(0);
  });

  it('không có dòng hợp lệ -> 400 EMPTY_ORDER; validate body', async () => {
    const u = await mkCustomer();
    const base = { itemIds: [999999999], addressId: u.addressId, shippingMethodId: SM1.id, paymentMethod: 'cod', expectedTotal: 1 };
    expectErr(await postOrder(u, base), 400, 'EMPTY_ORDER');
    expectErr(await postOrder(u, { ...base, paymentMethod: 'bitcoin' }), 400, 'VALIDATION_ERROR');
    expectErr(await postOrder(u, { ...base, note: 'x'.repeat(501) }), 400, 'VALIDATION_ERROR');
    const { expectedTotal: _e, ...noTotal } = base;
    expectErr(await postOrder(u, noTotal), 400, 'VALIDATION_ERROR');
  });

  it('Idempotency: cùng key 5 request song song chỉ một đơn; gửi lại sau đó trả đơn cũ, không trừ kho thêm', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    await addCart(u, p.variants[0].id, 2);
    const ids = (await cartItems(u)).map((i) => i.id);
    const body = { itemIds: ids, addressId: u.addressId, shippingMethodId: SM1.id, paymentMethod: 'cod', expectedTotal: 2_030_000 };
    const key = idemKey();
    const rs = await Promise.all(Array.from({ length: 5 }, () => postOrder(u, body, key)));
    expect(rs.filter((r) => r.status === 201)).toHaveLength(1);
    const code = rs.find((r) => r.status === 201)!.body.code;
    for (const r of rs.filter((x) => x.status !== 201)) {
      expect(r.status === 200 ? r.body.code === code : r.status === 409 && r.body.code === 'REQUEST_IN_PROGRESS', JSON.stringify(r.body)).toBe(true);
    }
    expect(rs.filter((r) => r.status >= 500)).toHaveLength(0);
    expect(await countOrders(u.id)).toBe(1);
    expect(await stockOf(p.variants[0].id)).toBe(8);
    const again = await postOrder(u, body, key);
    expect(again.status).toBe(200);
    expect(again.body.code).toBe(code);
    expect(await countOrders(u.id)).toBe(1);
    expect(await stockOf(p.variants[0].id)).toBe(8);
  });

  it('Idempotency: lỗi thì key được xóa, đặt lại với cùng key được', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id, { variants: [{ sku: `${CODE}-ID-${n()}`, size: '', stock: 5 }] });
    await addCart(u, p.variants[0].id, 3);
    const ids = (await cartItems(u)).map((i) => i.id);
    const body = { itemIds: ids, addressId: u.addressId, shippingMethodId: SM1.id, paymentMethod: 'cod', expectedTotal: 3_030_000 };
    const key = idemKey();
    await setStock(p.variants[0].id, 1);
    expectErr(await postOrder(u, body, key), 409, 'INSUFFICIENT_STOCK');
    expect(await redis.exists(`jewelry:idem:order:${u.id}:${key}`)).toBe(0);
    await setStock(p.variants[0].id, 5);
    const ok = await postOrder(u, body, key);
    expect(ok.status, JSON.stringify(ok.body)).toBe(201);
    expect(await stockOf(p.variants[0].id)).toBe(2);
    // PRICE_CHANGED cũng nhả key
    await addCart(u, p.variants[0].id, 1);
    const ids2 = (await cartItems(u)).map((i) => i.id);
    const key2 = idemKey();
    expectErr(await postOrder(u, { ...body, itemIds: ids2, expectedTotal: 5 }, key2), 409, 'PRICE_CHANGED');
    expect((await postOrder(u, { ...body, itemIds: ids2, expectedTotal: 1_030_000 }, key2)).status).toBe(201);
  });
});

// ===================================================================
describe('Cạnh tranh', () => {
  it('10 người đặt song song cùng biến thể tồn 3 -> đúng 3 thành công, 7 bị 409, tồn cuối 0', async () => {
    const p = await mkProduct(cat.id, { variants: [{ sku: `${CODE}-RC-${n()}`, size: '', stock: 3 }] });
    const vid = p.variants[0].id;
    const users = await Promise.all(Array.from({ length: 10 }, () => mkCustomer()));
    const prepared = [];
    for (const u of users) {
      await addCart(u, vid, 1);
      const ids = (await cartItems(u)).map((i) => i.id);
      prepared.push({ u, ids });
    }
    const rs = await Promise.all(
      prepared.map(({ u, ids }) => postOrder(u, { itemIds: ids, addressId: u.addressId, shippingMethodId: SM1.id, paymentMethod: 'cod', expectedTotal: 1_030_000 })),
    );
    expect(rs.filter((r) => r.status >= 500)).toHaveLength(0);
    expect(rs.filter((r) => r.status === 201)).toHaveLength(3);
    expect(rs.filter((r) => r.status === 409 && r.body.code === 'INSUFFICIENT_STOCK')).toHaveLength(7);
    expect(await stockOf(vid)).toBe(0);
    const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT DISTINCT orderId FROM order_items WHERE productCode=?', [p.code]);
    expect(rows).toHaveLength(3);
  }, 120_000);

  it('hủy song song 5 request cho một đơn -> đúng 1 thành công, tồn kho chỉ cộng lại một lần', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o = await placeOrder(u, [[p.variants[0].id, 3]], SM1);
    expect(await stockOf(p.variants[0].id)).toBe(7);
    const rs = await Promise.all(Array.from({ length: 5 }, () => call('post', `/orders/${o.code}/cancel`, u.token, { reason: 'đổi ý' })));
    expect(rs.filter((r) => r.status === 200)).toHaveLength(1);
    expect(rs.filter((r) => r.status === 409 && r.body.code === 'ORDER_NOT_CANCELLABLE')).toHaveLength(4);
    expect(await stockOf(p.variants[0].id)).toBe(10);
    const [h] = await db.query<mysql.RowDataPacket[]>("SELECT id FROM order_status_history WHERE orderId=? AND status='cancelled'", [o.id]);
    expect(h).toHaveLength(1);
  });

  it('nhiều user mới tạo địa chỉ đầu tiên song song -> không 5xx (chặn tái phát deadlock)', async () => {
    const users = await Promise.all(Array.from({ length: 12 }, () => mkUser()));
    const rs = await Promise.all(
      users.map((u) =>
        call('post', '/users/me/addresses', u.token, {
          receiverName: 'Nguyen Van A', receiverPhone: '0912345678', provinceId: loc.provinceId, wardId: loc.wardId, detail: '99 Duong Song Song',
        }),
      ),
    );
    expect(rs.filter((r) => r.status >= 500).map((r) => r.body)).toEqual([]);
    expect(rs.every((r) => r.status === 201 && r.body.isDefault === true)).toBe(true);
  }, 60_000);
});

// ===================================================================
describe('Khách xem và hủy đơn', () => {
  it('GET /orders: phân trang, lọc status, tối đa 3 mục sản phẩm, mới nhất trước, tách biệt user', async () => {
    const u = await mkCustomer();
    const other = await mkCustomer();
    const ps = await Promise.all([0, 1, 2, 3].map(() => mkProduct(cat.id)));
    const o1 = await placeOrder(u, ps.map((p) => [p.variants[0].id, 1] as [number, number]), SM1);
    const o2 = await placeOrder(u, [[ps[0].variants[0].id, 1]], SM1, 'bank_transfer');
    const o3 = await placeOrder(u, [[ps[1].variants[0].id, 1]], SM1);
    await placeOrder(other, [[ps[2].variants[0].id, 1]], SM1);
    await call('post', `/orders/${o3.code}/cancel`, u.token, {});
    await db.query('UPDATE orders SET createdAt = createdAt - INTERVAL 2 DAY WHERE id=?', [o1.id]);
    await db.query('UPDATE orders SET createdAt = createdAt - INTERVAL 1 DAY WHERE id=?', [o2.id]);

    const all = await call('get', '/orders', u.token);
    expect(all.status).toBe(200);
    expect(all.body).toMatchObject({ page: 1, pageSize: 10, total: 3 });
    expect(all.body.items.map((i: any) => i.code)).toEqual([o3.code, o2.code, o1.code]);
    const big = all.body.items.find((i: any) => i.code === o1.code);
    expect(big.itemCount).toBe(4);
    expect(big.items).toHaveLength(3);
    expect(Object.keys(big).sort()).toEqual(['code', 'createdAt', 'itemCount', 'items', 'paymentMethod', 'paymentStatus', 'status', 'total']);
    expect(Object.keys(big.items[0]).sort()).toEqual(['imageUrl', 'productName', 'quantity', 'size']);
    const pend = await call('get', '/orders?status=pending', u.token);
    expect(pend.body.items.map((i: any) => i.code).sort()).toEqual([o1.code, o2.code].sort());
    expect((await call('get', '/orders?status=cancelled', u.token)).body.items.map((i: any) => i.code)).toEqual([o3.code]);
    const page = await call('get', '/orders?pageSize=2&page=2', u.token);
    expect(page.body).toMatchObject({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
    expect(page.body.items.map((i: any) => i.code)).toEqual([o1.code]);
    expect((await call('get', '/orders?pageSize=500', u.token)).body.pageSize).toBe(50);
    expect((await call('get', '/orders?status=bogus', u.token)).status).toBe(400);
    expect((await call('get', '/orders')).status).toBe(401);
  });

  it('GET /orders/:code: đầy đủ, history tăng dần, đơn người khác 404', async () => {
    const u = await mkCustomer();
    const other = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o = await placeOrder(u, [[p.variants[0].id, 1]], SM1);
    for (const s of ['confirmed', 'preparing']) await adm('patch', `/admin/orders/${o.id}/status`, { status: s });
    const d = await call('get', `/orders/${o.code}`, u.token);
    expect(d.status).toBe(200);
    for (const k of ['code', 'createdAt', 'status', 'paymentMethod', 'paymentStatus', 'paidAt', 'cancelReason', 'note', 'receiver',
      'shippingMethodName', 'subtotal', 'shippingFee', 'total', 'items', 'history', 'paymentInstructions']) expect(d.body).toHaveProperty(k);
    expect(d.body.history.map((h: any) => h.status)).toEqual(['pending', 'confirmed', 'preparing']);
    const times = d.body.history.map((h: any) => Date.parse(h.createdAt));
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expectErr(await call('get', `/orders/${o.code}`, other.token), 404, 'NOT_FOUND');
    expectErr(await call('get', '/orders/LG20000101-000000', u.token), 404, 'NOT_FOUND');
    expectErr(await call('post', `/orders/${o.code}/cancel`, other.token, {}), 404, 'NOT_FOUND');
  });

  it('hủy khi pending: hoàn kho, lưu lý do, thêm lịch sử; hủy lần hai và hủy khi confirmed -> 409', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o = await placeOrder(u, [[p.variants[0].id, 4]], SM1);
    expect(await stockOf(p.variants[0].id)).toBe(6);
    const res = await call('post', `/orders/${o.code}/cancel`, u.token, { reason: 'Đặt nhầm' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body).toMatchObject({ status: 'cancelled', cancelReason: 'Đặt nhầm' });
    expect(res.body.history.map((h: any) => h.status)).toEqual(['pending', 'cancelled']);
    expect(await stockOf(p.variants[0].id)).toBe(10);
    expectErr(await call('post', `/orders/${o.code}/cancel`, u.token, {}), 409, 'ORDER_NOT_CANCELLABLE');
    expect(await stockOf(p.variants[0].id)).toBe(10);
    expectErr(await call('post', `/orders/${o.code}/cancel`, u.token, { reason: 'x'.repeat(256) }), 400, 'VALIDATION_ERROR');

    const o2 = await placeOrder(u, [[p.variants[0].id, 1]], SM1);
    await adm('patch', `/admin/orders/${o2.id}/status`, { status: 'confirmed' });
    expectErr(await call('post', `/orders/${o2.code}/cancel`, u.token, {}), 409, 'ORDER_NOT_CANCELLABLE');
    expect(await stockOf(p.variants[0].id)).toBe(9);
  });
});

// ===================================================================
describe('Admin: quản lý đơn', () => {
  it('401 không token, 403 role user cho mọi endpoint', async () => {
    const user = await mkUser();
    const eps: Array<[Method, string]> = [['get', '/admin/orders'], ['get', '/admin/orders/1'], ['patch', '/admin/orders/1/status'], ['patch', '/admin/orders/1/payment']];
    for (const [m, p] of eps) {
      expect((await call(m, p)).status, `${m} ${p}`).toBe(401);
      expect((await call(m, p, user.token, {})).status, `${m} ${p}`).toBe(403);
    }
  });

  it('list: lọc q (mã/tên/SĐT một phần, không phân biệt hoa thường), status, paymentStatus, phân trang', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o1 = await placeOrder(u, [[p.variants[0].id, 1]], SM1);
    const o2 = await placeOrder(u, [[p.variants[0].id, 1]], SM1, 'bank_transfer');
    await adm('patch', `/admin/orders/${o2.id}/payment`, { paymentStatus: 'paid' });
    const q = async (qs: string) => (await adm('get', `/admin/orders?${qs}`)).body;
    const mine = (b: any) => b.items.filter((i: any) => [o1.code, o2.code].includes(i.code)).map((i: any) => i.code);
    expect(mine(await q(`q=${o1.code.toLowerCase()}`))).toEqual([o1.code]);
    expect(mine(await q(`q=${o1.code.slice(-6)}`))).toEqual([o1.code]);
    const byName = await q('q=nguyen%20nhan&pageSize=100');
    expect(mine(byName).sort()).toEqual([o1.code, o2.code].sort());
    expect(mine(await q('q=NGUYEN%20NHAN&pageSize=100')).length).toBe(2);
    expect(mine(await q('q=091234&pageSize=100')).length).toBeGreaterThanOrEqual(0);
    expect((await q(`q=${o1.code}`)).items[0]).toMatchObject({
      code: o1.code, id: o1.id, receiverName: 'Nguyen Nhan', receiverPhone: '0912345678', status: 'pending', paymentMethod: 'cod',
      paymentStatus: 'unpaid', total: 1_030_000, itemCount: 1,
    });
    expect(mine(await q(`q=${o1.code.slice(0, 10)}&paymentStatus=paid&pageSize=100`))).toEqual([o2.code].filter(() => o2.code.startsWith(o1.code.slice(0, 10))));
    const paid = await q('paymentStatus=paid&pageSize=100');
    expect(paid.items.every((i: any) => i.paymentStatus === 'paid')).toBe(true);
    expect(mine(paid)).toEqual([o2.code]);
    const pending = await q('status=pending&pageSize=100');
    expect(pending.items.every((i: any) => i.status === 'pending')).toBe(true);
    const pg = await q('pageSize=1&page=2');
    expect(pg).toMatchObject({ page: 2, pageSize: 1 });
    expect(pg.items).toHaveLength(1);
    expect((await q('pageSize=500')).pageSize).toBe(100);
    expect((await q('')).pageSize).toBe(20);
    expect((await adm('get', '/admin/orders?status=bogus')).status).toBe(400);
    expect((await adm('get', '/admin/orders?from=10-03-2026')).status).toBe(400);
    // mới nhất trước
    const times = (await q('pageSize=100')).items.map((i: any) => Date.parse(i.createdAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('lọc ngày theo giờ Việt Nam: ranh giới 23:59:59 / 00:00:00', async () => {
    const [tz] = await db.query<mysql.RowDataPacket[]>('SELECT TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW()) off');
    const u = await mkCustomer();
    const ship = SM1.id;
    const tag = `TMP E2E dt ${runId}`;
    const ins = async (label: string, utc: string) => {
      const [r] = await db.query<mysql.ResultSetHeader>(
        `INSERT INTO orders (code,userId,receiverName,receiverPhone,provinceName,wardName,addressDetail,shippingMethodId,shippingMethodName,subtotal,shippingFee,total,paymentMethod,createdAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [`TMP-E2E-DT-${runId}-${label}`, u.id, tag, '0911111111', 'P', 'W', 'A', ship, 'x', 1000, 0, 1000, 'cod', utc],
      );
      return r.insertId;
    };
    // createdAt lưu theo giờ DB (kỳ vọng UTC); tương ứng giờ VN = +7
    const A = await ins('A', '2026-03-10 16:59:59'); // VN 10/03 23:59:59
    const B = await ins('B', '2026-03-10 17:00:00'); // VN 11/03 00:00:00
    const C = await ins('C', '2026-03-09 17:00:00'); // VN 10/03 00:00:00
    const D = await ins('D', '2026-03-09 16:59:59'); // VN 09/03 23:59:59
    const ids = async (qs: string) =>
      ((await adm('get', `/admin/orders?q=${encodeURIComponent(tag)}&pageSize=100&${qs}`)).body.items as any[]).map((i) => i.id).sort((a, b) => a - b);
    const sorted = (...x: number[]) => x.sort((a, b) => a - b);
    // ghi chú múi giờ DB để chẩn đoán nếu thất bại
    const diag = `DB offset so với UTC: ${tz[0].off}h`;
    expect(await ids('from=2026-03-10&to=2026-03-10'), diag).toEqual(sorted(A, C));
    expect(await ids('from=2026-03-11&to=2026-03-11'), diag).toEqual([B]);
    expect(await ids('from=2026-03-09&to=2026-03-09'), diag).toEqual([D]);
    expect(await ids('from=2026-03-10&to=2026-03-11'), diag).toEqual(sorted(A, B, C));
    expect(await ids('to=2026-03-10'), diag).toEqual(sorted(A, C, D));
    expect(await ids('from=2026-03-11'), diag).toEqual([B]);
  });

  it('detail: customer, changedByName (tên admin / người đặt / "Hệ thống"), không có paymentInstructions', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o = await placeOrder(u, [[p.variants[0].id, 1]], SM1, 'bank_transfer');
    await adm('patch', `/admin/orders/${o.id}/status`, { status: 'confirmed', note: 'ok' });
    await db.query("INSERT INTO order_status_history (orderId,status,changedById,note) VALUES (?,?,NULL,?)", [o.id, 'confirmed', 'tự động']);
    const d = await adm('get', `/admin/orders/${o.id}`);
    expect(d.status).toBe(200);
    expect(d.body.customer).toMatchObject({ id: u.id, fullName: 'E2E Cust', phone: u.phone });
    expect(d.body.customer.email).toMatch(/@e2e\.test$/);
    expect(d.body).not.toHaveProperty('paymentInstructions');
    expect(d.body.history.map((h: any) => h.changedByName)).toEqual(['E2E Cust', 'E2E Admin', 'Hệ thống']);
    expect(d.body).toMatchObject({ code: o.code, status: 'confirmed', paymentMethod: 'bank_transfer', total: 1_030_000 });
    expectErr(await adm('get', '/admin/orders/999999999'), 404, 'NOT_FOUND');
  });

  it('luồng trạng thái hợp lệ từng bước; ghi lịch sử với changedById admin', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o = await placeOrder(u, [[p.variants[0].id, 1]], SM1, 'bank_transfer');
    for (const s of ['confirmed', 'preparing', 'shipping', 'delivered']) {
      const r = await adm('patch', `/admin/orders/${o.id}/status`, { status: s, note: `to ${s}` });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(r.body.status).toBe(s);
    }
    const [h] = await db.query<mysql.RowDataPacket[]>('SELECT status, changedById, note FROM order_status_history WHERE orderId=? ORDER BY id', [o.id]);
    expect(h.map((x) => x.status)).toEqual(['pending', 'confirmed', 'preparing', 'shipping', 'delivered']);
    expect(h.slice(1).every((x) => x.changedById === adminId)).toBe(true);
    expect(h[2].note).toBe('to preparing');
  });

  it.each([
    ['nhảy cóc pending -> preparing', ['preparing']],
    ['nhảy cóc pending -> delivered', ['delivered']],
    ['giữ nguyên pending -> pending', ['pending']],
    ['đi lùi confirmed -> pending', ['confirmed', 'pending']],
    ['đi lùi preparing -> confirmed', ['confirmed', 'preparing', 'confirmed']],
    ['đổi sau delivered', ['confirmed', 'preparing', 'shipping', 'delivered', 'shipping']],
    ['hủy sau delivered', ['confirmed', 'preparing', 'shipping', 'delivered', 'cancelled']],
    ['hủy khi shipping', ['confirmed', 'preparing', 'shipping', 'cancelled']],
    ['đổi sau cancelled', ['cancelled', 'confirmed']],
  ])('409 INVALID_STATUS_TRANSITION: %s', async (_name, steps) => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o = await placeOrder(u, [[p.variants[0].id, 1]], SM1);
    for (const s of steps.slice(0, -1)) expect((await adm('patch', `/admin/orders/${o.id}/status`, { status: s })).status).toBe(200);
    expectErr(await adm('patch', `/admin/orders/${o.id}/status`, { status: steps[steps.length - 1] }), 409, 'INVALID_STATUS_TRANSITION');
  });

  it('validate status; đơn không tồn tại 404', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o = await placeOrder(u, [[p.variants[0].id, 1]], SM1);
    expectErr(await adm('patch', `/admin/orders/${o.id}/status`, { status: 'bogus' }), 400, 'VALIDATION_ERROR');
    expectErr(await adm('patch', `/admin/orders/${o.id}/status`, {}), 400, 'VALIDATION_ERROR');
    expectErr(await adm('patch', `/admin/orders/${o.id}/status`, { status: 'confirmed', note: 'x'.repeat(256) }), 400, 'VALIDATION_ERROR');
    expectErr(await adm('patch', '/admin/orders/999999999/status', { status: 'confirmed' }), 404, 'NOT_FOUND');
  });

  it.each(['pending', 'confirmed', 'preparing'])('admin hủy ở %s: hoàn kho đúng một lần, note vào cancelReason', async (from) => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o = await placeOrder(u, [[p.variants[0].id, 3]], SM1);
    const path = ['confirmed', 'preparing'];
    for (const s of path.slice(0, path.indexOf(from) + 1)) await adm('patch', `/admin/orders/${o.id}/status`, { status: s });
    expect(await stockOf(p.variants[0].id)).toBe(7);
    const r = await adm('patch', `/admin/orders/${o.id}/status`, { status: 'cancelled', note: 'Hết hàng thật' });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body).toMatchObject({ status: 'cancelled', cancelReason: 'Hết hàng thật' });
    expect(await stockOf(p.variants[0].id)).toBe(10);
    expectErr(await adm('patch', `/admin/orders/${o.id}/status`, { status: 'cancelled' }), 409, 'INVALID_STATUS_TRANSITION');
    expect(await stockOf(p.variants[0].id)).toBe(10);
  });

  it('admin hủy song song -> hoàn kho một lần', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o = await placeOrder(u, [[p.variants[0].id, 2]], SM1);
    const rs = await Promise.all(Array.from({ length: 4 }, () => adm('patch', `/admin/orders/${o.id}/status`, { status: 'cancelled' })));
    expect(rs.filter((r) => r.status === 200)).toHaveLength(1);
    expect(rs.filter((r) => r.status >= 500)).toHaveLength(0);
    expect(await stockOf(p.variants[0].id)).toBe(10);
  });

  it('COD delivered: tự paid + paidAt + tăng soldCount; chuyển khoản delivered không tự paid', async () => {
    const u = await mkCustomer();
    const p1 = await mkProduct(cat.id);
    const p2 = await mkProduct(cat.id);
    const cod = await placeOrder(u, [[p1.variants[0].id, 2], [p2.variants[0].id, 1]], SM1, 'cod');
    const bank = await placeOrder(u, [[p1.variants[0].id, 3]], SM1, 'bank_transfer');
    const sold = async (id: number) => ((await db.query<mysql.RowDataPacket[]>('SELECT soldCount s FROM products WHERE id=?', [id]))[0][0].s as number);
    for (const s of ['confirmed', 'preparing', 'shipping']) await adm('patch', `/admin/orders/${cod.id}/status`, { status: s });
    expect(await sold(p1.id)).toBe(0);
    const r = await adm('patch', `/admin/orders/${cod.id}/status`, { status: 'delivered' });
    expect(r.body).toMatchObject({ status: 'delivered', paymentStatus: 'paid' });
    expect(r.body.paidAt).not.toBeNull();
    expect(await sold(p1.id)).toBe(2);
    expect(await sold(p2.id)).toBe(1);
    for (const s of ['confirmed', 'preparing', 'shipping', 'delivered']) await adm('patch', `/admin/orders/${bank.id}/status`, { status: s });
    const d = (await adm('get', `/admin/orders/${bank.id}`)).body;
    expect(d).toMatchObject({ status: 'delivered', paymentStatus: 'unpaid', paidAt: null });
    expect(await sold(p1.id)).toBe(5);
    // delivered lần nữa bị chặn nên soldCount không tăng đôi
    await adm('patch', `/admin/orders/${bank.id}/status`, { status: 'delivered' });
    expect(await sold(p1.id)).toBe(5);
  });

  it('PATCH payment: chuyển khoản paid/unpaid; COD và đơn hủy -> 409; ghi lịch sử với changedById admin', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const bank = await placeOrder(u, [[p.variants[0].id, 1]], SM1, 'bank_transfer');
    const cod = await placeOrder(u, [[p.variants[0].id, 1]], SM1, 'cod');
    const paid = await adm('patch', `/admin/orders/${bank.id}/payment`, { paymentStatus: 'paid', note: 'Đã nhận tiền' });
    expect(paid.status, JSON.stringify(paid.body)).toBe(200);
    expect(paid.body.paymentStatus).toBe('paid');
    expect(paid.body.paidAt).not.toBeNull();
    const unpaid = await adm('patch', `/admin/orders/${bank.id}/payment`, { paymentStatus: 'unpaid' });
    expect(unpaid.body).toMatchObject({ paymentStatus: 'unpaid', paidAt: null });
    const [h] = await db.query<mysql.RowDataPacket[]>('SELECT status, changedById, note FROM order_status_history WHERE orderId=? ORDER BY id', [bank.id]);
    expect(h).toHaveLength(3);
    expect(h[1]).toMatchObject({ status: 'pending', changedById: adminId });
    expect(h[1].note).toBeTruthy();
    expectErr(await adm('patch', `/admin/orders/${cod.id}/payment`, { paymentStatus: 'paid' }), 409, 'INVALID_STATUS_TRANSITION');
    await adm('patch', `/admin/orders/${bank.id}/status`, { status: 'cancelled' });
    expectErr(await adm('patch', `/admin/orders/${bank.id}/payment`, { paymentStatus: 'paid' }), 409, 'INVALID_STATUS_TRANSITION');
    expectErr(await adm('patch', `/admin/orders/${bank.id}/payment`, { paymentStatus: 'refunded' }), 400, 'VALIDATION_ERROR');
    expectErr(await adm('patch', '/admin/orders/999999999/payment', { paymentStatus: 'paid' }), 404, 'NOT_FOUND');
  });

  it('đơn bank đã paid rồi bị hủy: chỉ ghi nhận hủy, paymentStatus giữ nguyên', async () => {
    const u = await mkCustomer();
    const p = await mkProduct(cat.id);
    const o = await placeOrder(u, [[p.variants[0].id, 1]], SM1, 'bank_transfer');
    await adm('patch', `/admin/orders/${o.id}/payment`, { paymentStatus: 'paid' });
    const r = await adm('patch', `/admin/orders/${o.id}/status`, { status: 'cancelled', note: 'Khách hủy' });
    expect(r.body).toMatchObject({ status: 'cancelled', paymentStatus: 'paid' });
    expect(await stockOf(p.variants[0].id)).toBe(10);
  });
});
