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
let seq = 0;
const n = () => ++seq;

let app: INestApplication;
let db: mysql.Connection;
let redis: Redis;
let adminToken = '';

// Không bao giờ chạm Cloudinary thật.
const noStorage = { isConfigured: () => false, upload: async () => { throw new Error('off'); }, delete: async () => undefined };

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
const call = (method: Method, path: string, token?: string, body?: object) => {
  const r = request(app.getHttpServer())[method](`/api${path}`);
  if (token) r.set('Authorization', `Bearer ${token}`);
  return body ? r.send(body) : r;
};
const adm = (method: Method, path: string, body?: object) => call(method, path, adminToken, body);

interface TestUser { id: number; token: string; phone: string }
async function mkUser(role: 'admin' | 'user' = 'user'): Promise<TestUser> {
  const email = `e2e-shop-${runId}-${n()}@e2e.test`;
  const phone = '0997' + String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
  const hash = await bcrypt.hash(PASSWORD, 4);
  const [r] = await db.query<mysql.ResultSetHeader>(
    'INSERT INTO users (fullName,email,phone,passwordHash,role,status) VALUES (?,?,?,?,?,?)',
    ['E2E Shop', email, phone, hash, role, 'active'],
  );
  const res = await request(app.getHttpServer()).post('/api/auth/login').send({ phone, password: PASSWORD });
  expect(res.status).toBe(200);
  return { id: r.insertId, token: res.body.accessToken, phone };
}

function expectErr(res: request.Response, status: number, code: string) {
  expect(res.status, JSON.stringify(res.body)).toBe(status);
  expect(res.body.code).toBe(code);
}
const fieldsOf = (res: request.Response): string[] => (res.body.details ?? []).map((d: { field: string }) => d.field);

async function mkCategory() {
  const res = await adm('post', '/admin/categories', { name: `${NAME} cat ${n()}` });
  expect(res.status).toBe(201);
  return res.body as { id: number };
}
async function mkProduct(categoryId: number, over: Record<string, unknown> = {}) {
  const i = n();
  const res = await adm('post', '/admin/products', {
    code: `${CODE}-${i}`,
    name: `${NAME} P${i}`,
    categoryId,
    price: 1_000_000,
    variants: [{ sku: `${CODE}-${i}-A`, size: '', stock: 5 }],
    ...over,
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as any;
}
const setStock = (variantId: number, stock: number) => db.query('UPDATE product_variants SET stock=? WHERE id=?', [stock, variantId]);
const cartRows = async (userId: number) =>
  (await db.query<mysql.RowDataPacket[]>('SELECT id FROM carts WHERE userId=?', [userId]))[0].length;

async function cleanup() {
  const sub = "(SELECT id FROM users WHERE email LIKE '%@e2e.test')";
  await db.query(`DELETE FROM cart_items WHERE cartId IN (SELECT id FROM carts WHERE userId IN ${sub})`);
  await db.query(`DELETE FROM carts WHERE userId IN ${sub}`);
  await db.query(`DELETE FROM wishlists WHERE userId IN ${sub}`);
  await db.query(`DELETE FROM addresses WHERE userId IN ${sub}`);
  await db.query(`DELETE FROM token_blacklist WHERE userId IN ${sub}`);
  await db.query("DELETE FROM products WHERE code LIKE 'TMP-E2E-%'");
  for (let i = 0; i < 4; i++) {
    await db.query(
      "DELETE FROM categories WHERE name LIKE 'TMP E2E%' AND id NOT IN (SELECT parentId FROM (SELECT parentId FROM categories WHERE parentId IS NOT NULL) t)",
    );
  }
  await db.query("DELETE FROM users WHERE email LIKE '%@e2e.test'");
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
  const m = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ImageStorage).useValue(noStorage).overrideProvider(MailService).useValue({ sendOtpMail: () => undefined, sendOrderPaidMail: () => undefined, sendOrderDeliveredMail: () => undefined }).compile();
  app = m.createNestApplication();
  configureApp(app);
  await app.init();
  adminToken = (await mkUser('admin')).token;
}, 90_000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await app?.close();
    await db?.end();
    await redis?.quit().catch(() => undefined);
  }
}, 60_000);

// ===================================================================
describe('Địa giới hành chính', () => {
  it('34 tỉnh/thành, công khai, sắp theo tên, tạo cache Redis', async () => {
    const res = await call('get', '/locations/provinces');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(34);
    expect(Object.keys(res.body[0]).sort()).toEqual(['code', 'id', 'name']);
    const names: string[] = res.body.map((p: any) => p.name);
    for (let i = 1; i < names.length; i++) expect(names[i - 1].localeCompare(names[i], 'en', { sensitivity: 'base' })).toBeLessThanOrEqual(0);
    expect(await redis.exists('jewelry:cache:provinces')).toBe(1);
    const ttl = await redis.ttl('jewelry:cache:provinces');
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(86400);
  });
  it('xã/phường theo tỉnh, cache theo tỉnh; tỉnh không tồn tại -> 404', async () => {
    const provinces = (await call('get', '/locations/provinces')).body;
    const res = await call('get', `/locations/provinces/${provinces[0].id}/wards`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(Object.keys(res.body[0]).sort()).toEqual(['code', 'id', 'name']);
    expect(await redis.exists(`jewelry:cache:wards:${provinces[0].id}`)).toBe(1);
    // lần hai (từ cache) cho kết quả y hệt
    expect((await call('get', `/locations/provinces/${provinces[0].id}/wards`)).body).toEqual(res.body);
    expectErr(await call('get', '/locations/provinces/999999999/wards'), 404, 'NOT_FOUND');
  });
});

// ===================================================================
describe('Sổ địa chỉ', () => {
  let p1: { id: number }, p2: { id: number };
  let w1: number, w1b: number, w2: number;
  beforeAll(async () => {
    const provs = (await call('get', '/locations/provinces')).body;
    [p1, p2] = provs;
    const a = (await call('get', `/locations/provinces/${p1.id}/wards`)).body;
    const b = (await call('get', `/locations/provinces/${p2.id}/wards`)).body;
    w1 = a[0].id;
    w1b = a[1].id;
    w2 = b[0].id;
  });
  const body = (over: Record<string, unknown> = {}) => ({
    receiverName: 'Nguyen Van A', receiverPhone: '0912345678', provinceId: p1.id, wardId: w1, detail: `So ${n()} duong ABC`, ...over,
  });
  const create = (u: TestUser, over: Record<string, unknown> = {}) => call('post', '/users/me/addresses', u.token, body(over));
  const list = async (u: TestUser) => (await call('get', '/users/me/addresses', u.token)).body as any[];

  it('401 không token', async () => {
    for (const [m, p] of [['get', ''], ['post', ''], ['patch', '/1'], ['put', '/1/default'], ['delete', '/1']] as const) {
      expect((await call(m, `/users/me/addresses${p}`)).status, `${m} ${p}`).toBe(401);
    }
  });
  it('địa chỉ đầu tiên tự mặc định; trả đủ trường kèm tên tỉnh/xã', async () => {
    const u = await mkUser();
    const res = await create(u);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body).toMatchObject({
      receiverName: 'Nguyen Van A', receiverPhone: '0912345678', provinceId: p1.id, wardId: w1, isDefault: true,
    });
    expect(typeof res.body.provinceName).toBe('string');
    expect(typeof res.body.wardName).toBe('string');
    const second = await create(u);
    expect(second.body.isDefault).toBe(false);
  });
  it.each([
    ['SĐT sai', { receiverPhone: '123' }, 'receiverPhone'],
    ['tên 1 ký tự', { receiverName: 'A' }, 'receiverName'],
    ['detail < 5 ký tự', { detail: 'abc' }, 'detail'],
    ['detail > 255 ký tự', { detail: 'x'.repeat(256) }, 'detail'],
    ['thiếu provinceId', { provinceId: undefined }, 'provinceId'],
  ])('validate: %s -> 400 VALIDATION_ERROR', async (_n, over, field) => {
    const u = await mkUser();
    const res = await create(u, over);
    expectErr(res, 400, 'VALIDATION_ERROR');
    expect(fieldsOf(res)).toContain(field);
  });
  it('xã không thuộc tỉnh / không tồn tại -> 400 INVALID_LOCATION (details.field=wardId)', async () => {
    const u = await mkUser();
    const wrong = await create(u, { wardId: w2 });
    expectErr(wrong, 400, 'INVALID_LOCATION');
    expect(fieldsOf(wrong)).toContain('wardId');
    expectErr(await create(u, { wardId: 999999999 }), 400, 'INVALID_LOCATION');
    expectErr(await create(u, { provinceId: 999999999 }), 400, 'INVALID_LOCATION');
    expect(await list(u)).toHaveLength(0);
  });
  it('giới hạn 10 địa chỉ', async () => {
    const u = await mkUser();
    for (let i = 0; i < 10; i++) expect((await create(u)).status).toBe(201);
    expectErr(await create(u), 400, 'ADDRESS_LIMIT_EXCEEDED');
  });
  it('15 request tạo song song -> đúng 10 thành công, đúng một mặc định', async () => {
    const u = await mkUser();
    const rs = await Promise.all(Array.from({ length: 15 }, () => create(u)));
    expect(rs.filter((r) => r.status === 201)).toHaveLength(10);
    expect(rs.filter((r) => r.status === 400 && r.body.code === 'ADDRESS_LIMIT_EXCEEDED')).toHaveLength(5);
    expect(rs.filter((r) => r.status >= 500)).toHaveLength(0);
    const all = await list(u);
    expect(all).toHaveLength(10);
    expect(all.filter((a) => a.isDefault)).toHaveLength(1);
  });
  it('luôn đúng một mặc định: tạo isDefault, PUT default, PATCH isDefault:false bị bỏ qua', async () => {
    const u = await mkUser();
    const a = (await create(u)).body;
    const b = (await create(u, { isDefault: true })).body;
    expect(b.isDefault).toBe(true);
    let all = await list(u);
    expect(all.filter((x) => x.isDefault).map((x) => x.id)).toEqual([b.id]);
    expect(all[0].id).toBe(b.id); // mặc định lên đầu
    const put = await call('put', `/users/me/addresses/${a.id}/default`, u.token);
    expect(put.status).toBe(200);
    expect(put.body).toMatchObject({ id: a.id, isDefault: true });
    all = await list(u);
    expect(all.filter((x) => x.isDefault).map((x) => x.id)).toEqual([a.id]);
    const patch = await call('patch', `/users/me/addresses/${a.id}`, u.token, { isDefault: false });
    expect(patch.status).toBe(200);
    expect(patch.body.isDefault).toBe(true);
    const patch2 = await call('patch', `/users/me/addresses/${b.id}`, u.token, { isDefault: true, detail: 'Dia chi moi 99' });
    expect(patch2.body).toMatchObject({ isDefault: true, detail: 'Dia chi moi 99' });
    expect((await list(u)).filter((x) => x.isDefault)).toHaveLength(1);
  });
  it('PATCH đổi tỉnh/xã kiểm tra INVALID_LOCATION', async () => {
    const u = await mkUser();
    const a = (await create(u)).body;
    expect((await call('patch', `/users/me/addresses/${a.id}`, u.token, { wardId: w1b })).body.wardId).toBe(w1b);
    expectErr(await call('patch', `/users/me/addresses/${a.id}`, u.token, { wardId: w2 }), 400, 'INVALID_LOCATION');
    const ok = await call('patch', `/users/me/addresses/${a.id}`, u.token, { provinceId: p2.id, wardId: w2 });
    expect(ok.body).toMatchObject({ provinceId: p2.id, wardId: w2 });
  });
  it('xóa mặc định thì địa chỉ tạo gần nhất lên thay', async () => {
    const u = await mkUser();
    const a = (await create(u)).body; // mặc định
    await create(u);
    const c = (await create(u)).body; // gần nhất
    expect((await call('delete', `/users/me/addresses/${a.id}`, u.token)).status).toBe(204);
    const all = await list(u);
    expect(all).toHaveLength(2);
    expect(all.filter((x) => x.isDefault).map((x) => x.id)).toEqual([c.id]);
    // xóa hết
    for (const x of all) await call('delete', `/users/me/addresses/${x.id}`, u.token);
    expect(await list(u)).toHaveLength(0);
  });
  it('địa chỉ của người khác -> 404 cho PATCH/PUT default/DELETE', async () => {
    const owner = await mkUser();
    const other = await mkUser();
    const a = (await create(owner)).body;
    expectErr(await call('patch', `/users/me/addresses/${a.id}`, other.token, { detail: 'hacker 12345' }), 404, 'NOT_FOUND');
    expectErr(await call('put', `/users/me/addresses/${a.id}/default`, other.token), 404, 'NOT_FOUND');
    expectErr(await call('delete', `/users/me/addresses/${a.id}`, other.token), 404, 'NOT_FOUND');
    expect(await list(other)).toHaveLength(0);
    expect(await list(owner)).toHaveLength(1);
    expect((await call('get', `/users/me/addresses/${a.id}`, other.token)).status).toBe(404);
  });
});

// ===================================================================
describe('Sản phẩm dùng chung cho yêu thích / giỏ hàng', () => {
  const ctx: Record<string, any> = {};
  beforeAll(async () => {
    ctx.cat = await mkCategory();
    ctx.hiddenCat = await mkCategory();
    ctx.S1 = await mkProduct(ctx.cat.id, { price: 1_000_000 }); // 1 biến thể, tồn 5
    ctx.M = await mkProduct(ctx.cat.id, {
      price: 2_000_000,
      variants: [
        { sku: `${CODE}-M-10`, size: '10', stock: 5 },
        { sku: `${CODE}-M-11`, size: '11', stock: 3 },
        { sku: `${CODE}-M-12`, size: '12', stock: 3 },
      ],
    });
    ctx.H = await mkProduct(ctx.cat.id); // sẽ bị ẩn
    ctx.HC = await mkProduct(ctx.hiddenCat.id); // danh mục sẽ bị ẩn
    await adm('patch', `/admin/products/${ctx.H.id}`, { isActive: false });
    await adm('patch', `/admin/categories/${ctx.hiddenCat.id}`, { isActive: false });
    // M: ẩn biến thể size 12 -> variantCount = 2
    await adm('patch', `/admin/products/${ctx.M.id}`, {
      variants: ctx.M.variants.slice(0, 2).map((v: any) => ({ id: v.id, sku: v.sku, size: v.size })),
    });
    // khuyến mại 20% cho S1
    await db.query('INSERT INTO promotions (name,productId,discountPercent,startsAt,endsAt,isActive) VALUES (?,?,?,?,?,1)', [
      `${NAME} promo`, ctx.S1.id, 20, new Date(Date.now() - 86_400_000), new Date(Date.now() + 86_400_000),
    ]);
  }, 60_000);

  describe('variantCount / singleVariantId', () => {
    const find = (items: any[], p: any) => items.find((i) => i.id === p.id);
    it('GET /products', async () => {
      const res = await call('get', `/products?q=${encodeURIComponent(CODE)}&pageSize=48`);
      expect(find(res.body.items, ctx.S1)).toMatchObject({ variantCount: 1, singleVariantId: ctx.S1.variants[0].id });
      expect(find(res.body.items, ctx.M)).toMatchObject({ variantCount: 2, singleVariantId: null });
    });
    it('related của chi tiết sản phẩm', async () => {
      const res = await call('get', `/products/${ctx.S1.slug}`);
      expect(find(res.body.related, ctx.M)).toMatchObject({ variantCount: 2, singleVariantId: null });
      const res2 = await call('get', `/products/${ctx.M.slug}`);
      expect(find(res2.body.related, ctx.S1)).toMatchObject({ variantCount: 1, singleVariantId: ctx.S1.variants[0].id });
    });
    it('wishlist', async () => {
      const u = await mkUser();
      await call('post', '/wishlist', u.token, { productId: ctx.S1.id });
      await call('post', '/wishlist', u.token, { productId: ctx.M.id });
      const res = await call('get', '/wishlist', u.token);
      expect(find(res.body.items, ctx.S1)).toMatchObject({ variantCount: 1, singleVariantId: ctx.S1.variants[0].id });
      expect(find(res.body.items, ctx.M)).toMatchObject({ variantCount: 2, singleVariantId: null });
    });
    it('biến thể ẩn không được tính; ẩn bớt còn 1 thì có singleVariantId', async () => {
      const p = await mkProduct(ctx.cat.id, {
        variants: [{ sku: `${CODE}-VC-1`, size: '1', stock: 1 }, { sku: `${CODE}-VC-2`, size: '2', stock: 1, isActive: false }],
      });
      const res = await call('get', `/products?q=${encodeURIComponent(p.code)}`);
      const visible = p.variants.find((v: any) => v.sku === `${CODE}-VC-1`);
      expect(res.body.items[0]).toMatchObject({ variantCount: 1, singleVariantId: visible.id });
    });
  });

  // -----------------------------------------------------------------
  describe('Yêu thích', () => {
    it('401 không token', async () => {
      expect((await call('get', '/wishlist')).status).toBe(401);
      expect((await call('get', '/wishlist/ids')).status).toBe(401);
      expect((await call('post', '/wishlist', undefined, { productId: 1 })).status).toBe(401);
      expect((await call('delete', '/wishlist/1')).status).toBe(401);
    });
    it('thêm idempotent: 201 rồi 200; 3 request song song không lỗi, chỉ một dòng', async () => {
      const u = await mkUser();
      const a = await call('post', '/wishlist', u.token, { productId: ctx.S1.id });
      expect(a.status).toBe(201);
      expect(a.body).toEqual({ productId: ctx.S1.id });
      const b = await call('post', '/wishlist', u.token, { productId: ctx.S1.id });
      expect(b.status).toBe(200);
      expect(b.body).toEqual({ productId: ctx.S1.id });
      const rs = await Promise.all(Array.from({ length: 3 }, () => call('post', '/wishlist', u.token, { productId: ctx.M.id })));
      expect(rs.every((r) => r.status === 200 || r.status === 201)).toBe(true);
      expect(rs.filter((r) => r.status === 201).length).toBe(1);
      const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM wishlists WHERE userId=?', [u.id]);
      expect(rows).toHaveLength(2);
    });
    it('sản phẩm không tồn tại / ẩn / danh mục ẩn -> 404; body sai -> 400', async () => {
      const u = await mkUser();
      expectErr(await call('post', '/wishlist', u.token, { productId: 999999999 }), 404, 'NOT_FOUND');
      expectErr(await call('post', '/wishlist', u.token, { productId: ctx.H.id }), 404, 'NOT_FOUND');
      expectErr(await call('post', '/wishlist', u.token, { productId: ctx.HC.id }), 404, 'NOT_FOUND');
      expectErr(await call('post', '/wishlist', u.token, { productId: 'abc' }), 400, 'VALIDATION_ERROR');
    });
    it('GET /wishlist: dạng item sản phẩm, addedAt, mới nhất trước, phân trang, loại sản phẩm đã ẩn', async () => {
      const u = await mkUser();
      const extra = await mkProduct(ctx.cat.id);
      for (const p of [ctx.S1, ctx.M, extra]) {
        await call('post', '/wishlist', u.token, { productId: p.id });
        await new Promise((r) => setTimeout(r, 1100)); // addedAt có độ phân giải giây
      }
      const res = await call('get', '/wishlist', u.token);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ page: 1, pageSize: 12, total: 3, totalPages: 1 });
      expect(res.body.items.map((i: any) => i.id)).toEqual([extra.id, ctx.M.id, ctx.S1.id]);
      const s1 = res.body.items.find((i: any) => i.id === ctx.S1.id);
      expect(s1).toMatchObject({
        code: ctx.S1.code, price: 1_000_000, salePrice: 800_000, discountPercent: 20, inStock: true,
        variantCount: 1, singleVariantId: ctx.S1.variants[0].id,
      });
      expect(typeof s1.addedAt).toBe('string');
      expect(Number.isNaN(Date.parse(s1.addedAt))).toBe(false);
      expect(s1).toHaveProperty('primaryImageUrl');
      expect(JSON.stringify(res.body)).not.toMatch(/costPrice/);
      const paged = await call('get', '/wishlist?pageSize=2&page=2', u.token);
      expect(paged.body).toMatchObject({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
      expect(paged.body.items.map((i: any) => i.id)).toEqual([ctx.S1.id]);
      // ẩn sản phẩm: biến mất khỏi danh sách nhưng vẫn còn trong DB
      await adm('patch', `/admin/products/${extra.id}`, { isActive: false });
      const after = await call('get', '/wishlist', u.token);
      expect(after.body.items.map((i: any) => i.id)).not.toContain(extra.id);
      expect(after.body.total).toBe(2);
      const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM wishlists WHERE userId=? AND productId=?', [u.id, extra.id]);
      expect(rows).toHaveLength(1);
    }, 30_000);
    it('GET /wishlist/ids, DELETE idempotent, tách biệt giữa các user', async () => {
      const u1 = await mkUser();
      const u2 = await mkUser();
      await call('post', '/wishlist', u1.token, { productId: ctx.S1.id });
      await call('post', '/wishlist', u1.token, { productId: ctx.M.id });
      await call('post', '/wishlist', u2.token, { productId: ctx.M.id });
      const ids = await call('get', '/wishlist/ids', u1.token);
      expect(ids.status).toBe(200);
      expect([...ids.body.productIds].sort()).toEqual([ctx.S1.id, ctx.M.id].sort());
      expect((await call('get', '/wishlist/ids', u2.token)).body.productIds).toEqual([ctx.M.id]);
      expect((await call('delete', `/wishlist/${ctx.S1.id}`, u1.token)).status).toBe(204);
      expect((await call('delete', `/wishlist/${ctx.S1.id}`, u1.token)).status).toBe(204);
      expect((await call('delete', '/wishlist/999999999', u1.token)).status).toBe(204);
      expect((await call('get', '/wishlist/ids', u1.token)).body.productIds).toEqual([ctx.M.id]);
      // xóa của u1 không ảnh hưởng u2
      await call('delete', `/wishlist/${ctx.M.id}`, u1.token);
      expect((await call('get', '/wishlist/ids', u2.token)).body.productIds).toEqual([ctx.M.id]);
      expect((await call('get', '/wishlist/ids', (await mkUser()).token)).body.productIds).toEqual([]);
    });
  });

  // -----------------------------------------------------------------
  describe('Giỏ hàng', () => {
    const add = (u: TestUser, variantId: number, quantity?: number) =>
      call('post', '/cart/items', u.token, quantity === undefined ? { variantId } : { variantId, quantity });
    const cart = async (u: TestUser) => (await call('get', '/cart', u.token)).body;
    const v = (p: any, i = 0) => p.variants[i].id as number;

    it('401 không token', async () => {
      for (const [m, p] of [['get', '/cart'], ['get', '/cart/summary'], ['post', '/cart/items'], ['patch', '/cart/items/1'],
        ['delete', '/cart/items/1'], ['post', '/cart/items/remove'], ['delete', '/cart']] as const) {
        expect((await call(m, p)).status, `${m} ${p}`).toBe(401);
      }
    });

    it('GET không tạo giỏ; giỏ rỗng và summary bằng 0', async () => {
      const u = await mkUser();
      const res = await call('get', '/cart', u.token);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ items: [], subtotal: 0, itemCount: 0, totalQuantity: 0, hasIssues: false });
      expect((await call('get', '/cart/summary', u.token)).body).toEqual({ itemCount: 0, totalQuantity: 0 });
      expect(await cartRows(u.id)).toBe(0);
    });

    it('thêm mới, cộng dồn, summary, dạng item đầy đủ', async () => {
      const u = await mkUser();
      const r1 = await add(u, v(ctx.M, 0));
      expect([200, 201], JSON.stringify(r1.body)).toContain(r1.status);
      expect(r1.body.items).toHaveLength(1);
      expect(r1.body.items[0]).toMatchObject({
        variantId: v(ctx.M, 0), productId: ctx.M.id, productCode: ctx.M.code, productName: ctx.M.name, productSlug: ctx.M.slug,
        size: '10', imageUrl: null, price: 2_000_000, salePrice: null, discountPercent: null, unitPrice: 2_000_000,
        quantity: 1, lineTotal: 2_000_000, stock: 5, available: true, issue: null,
      });
      expect(r1.body).toMatchObject({ subtotal: 2_000_000, itemCount: 1, totalQuantity: 1, hasIssues: false });
      const r2 = await add(u, v(ctx.M, 0), 2);
      expect(r2.body.items).toHaveLength(1);
      expect(r2.body.items[0].quantity).toBe(3);
      const r3 = await add(u, v(ctx.S1));
      expect(r3.body.items.map((i: any) => i.variantId)).toEqual([v(ctx.S1), v(ctx.M, 0)]); // thêm gần nhất lên đầu
      expect(r3.body).toMatchObject({ itemCount: 2, totalQuantity: 4 });
      expect((await call('get', '/cart/summary', u.token)).body).toEqual({ itemCount: 2, totalQuantity: 4 });
    });

    it('validate body: quantity 0, 11, không nguyên, thiếu variantId -> 400', async () => {
      const u = await mkUser();
      for (const quantity of [0, 11, 1.5, -1]) expectErr(await add(u, v(ctx.S1), quantity), 400, 'VALIDATION_ERROR');
      expectErr(await call('post', '/cart/items', u.token, {}), 400, 'VALIDATION_ERROR');
    });

    it('vượt 10 -> 400 QUANTITY_LIMIT_EXCEEDED, giỏ không đổi', async () => {
      const u = await mkUser();
      const p = await mkProduct(ctx.cat.id, { variants: [{ sku: `${CODE}-Q-${n()}`, size: '', stock: 50 }] });
      expect([200, 201]).toContain((await add(u, v(p), 8)).status);
      expectErr(await add(u, v(p), 3), 400, 'QUANTITY_LIMIT_EXCEEDED');
      expect((await cart(u)).items[0].quantity).toBe(8);
      expect((await add(u, v(p), 2)).body.items[0].quantity).toBe(10);
    });

    it('vượt tồn -> 409 INSUFFICIENT_STOCK kèm available và inCart, giỏ không đổi', async () => {
      const u = await mkUser();
      expect([200, 201]).toContain((await add(u, v(ctx.M, 1), 2)).status); // tồn 3
      const res = await add(u, v(ctx.M, 1), 2);
      expectErr(res, 409, 'INSUFFICIENT_STOCK');
      expect(res.body.available).toBe(3);
      expect(res.body.inCart).toBe(2);
      expect((await cart(u)).items[0].quantity).toBe(2);
      const fresh = await mkUser();
      const first = await add(fresh, v(ctx.M, 1), 5);
      expectErr(first, 409, 'INSUFFICIENT_STOCK');
      expect(first.body).toMatchObject({ available: 3, inCart: 0 });
      expect(await cartRows(fresh.id)).toBeLessThanOrEqual(1); // có thể đã có giỏ rỗng nhưng không có dòng
      expect((await cart(fresh)).items).toHaveLength(0);
    });

    it('biến thể không tồn tại -> 404', async () => {
      const u = await mkUser();
      expectErr(await add(u, 999999999), 404, 'NOT_FOUND');
    });

    it('ẩn sản phẩm / biến thể / danh mục -> 409 ITEM_UNAVAILABLE khi thêm', async () => {
      const u = await mkUser();
      expectErr(await add(u, v(ctx.H)), 409, 'ITEM_UNAVAILABLE'); // sản phẩm ẩn
      expectErr(await add(u, v(ctx.HC)), 409, 'ITEM_UNAVAILABLE'); // danh mục ẩn
      const hiddenVariant = ctx.M.variants[2].id; // đã bị ẩn khi setup
      expectErr(await add(u, hiddenVariant), 409, 'ITEM_UNAVAILABLE');
      expect((await cart(u)).items).toHaveLength(0);
    });

    it('thêm rồi bị ẩn (sản phẩm / biến thể / danh mục) -> issue UNAVAILABLE, không tính subtotal', async () => {
      const u = await mkUser();
      const cat = await mkCategory();
      const pa = await mkProduct(cat.id);
      const pb = await mkProduct(cat.id, { variants: [{ sku: `${CODE}-UB-1`, size: '1', stock: 5 }, { sku: `${CODE}-UB-2`, size: '2', stock: 5 }] });
      const pc = await mkProduct(cat.id);
      const ok = await mkProduct(ctx.cat.id, { price: 3_000_000 });
      for (const id of [v(pa), v(pb, 0), v(pc), v(ok)]) expect([200, 201]).toContain((await add(u, id)).status);
      await adm('patch', `/admin/products/${pa.id}`, { isActive: false });
      await adm('patch', `/admin/products/${pb.id}`, { variants: [{ id: pb.variants[1].id, sku: pb.variants[1].sku, size: '2' }] });
      await adm('patch', `/admin/categories/${cat.id}`, { isActive: false }); // pc ẩn theo danh mục (pa, pb cũng thuộc cat)
      const c = await cart(u);
      expect(c.items).toHaveLength(4);
      const issues = Object.fromEntries(c.items.map((i: any) => [i.productId, i.issue]));
      expect(issues[pa.id]).toBe('UNAVAILABLE');
      expect(issues[pb.id]).toBe('UNAVAILABLE');
      expect(issues[pc.id]).toBe('UNAVAILABLE');
      expect(issues[ok.id]).toBeNull();
      expect(c.items.find((i: any) => i.productId === pa.id).available).toBe(false);
      expect(c).toMatchObject({ subtotal: 3_000_000, hasIssues: true, itemCount: 4, totalQuantity: 4 });
    });

    it('tồn đổi sau khi thêm: OUT_OF_STOCK / INSUFFICIENT_STOCK; subtotal chỉ cộng dòng ổn', async () => {
      const u = await mkUser();
      const a = await mkProduct(ctx.cat.id, { price: 1_000_000, variants: [{ sku: `${CODE}-ST-A`, size: '', stock: 5 }] });
      const b = await mkProduct(ctx.cat.id, { price: 2_000_000, variants: [{ sku: `${CODE}-ST-B`, size: '', stock: 5 }] });
      const c = await mkProduct(ctx.cat.id, { price: 4_000_000, variants: [{ sku: `${CODE}-ST-C`, size: '', stock: 5 }] });
      await add(u, v(a), 2);
      await add(u, v(b), 3);
      await add(u, v(c), 1);
      await setStock(v(a), 0);
      await setStock(v(b), 2);
      const res = await cart(u);
      const by = (p: any) => res.items.find((i: any) => i.productId === p.id);
      expect(by(a)).toMatchObject({ issue: 'OUT_OF_STOCK', available: false, stock: 0 });
      expect(by(b)).toMatchObject({ issue: 'INSUFFICIENT_STOCK', available: false, stock: 2, quantity: 3 });
      expect(by(c)).toMatchObject({ issue: null, available: true });
      expect(res).toMatchObject({ subtotal: 4_000_000, hasIssues: true, itemCount: 3, totalQuantity: 6 });
    });

    it('giá khuyến mại: unitPrice/lineTotal/subtotal đúng; khuyến mại hết hạn không áp dụng', async () => {
      const u = await mkUser();
      const sale = ctx.S1; // giảm 20%, giá 1.000.000
      const expired = await mkProduct(ctx.cat.id, { price: 500_000 });
      await db.query('INSERT INTO promotions (name,productId,discountPercent,startsAt,endsAt,isActive) VALUES (?,?,?,?,?,1)', [
        `${NAME} promo exp`, expired.id, 50, new Date(Date.now() - 3 * 86_400_000), new Date(Date.now() - 2 * 86_400_000),
      ]);
      await add(u, v(sale), 3);
      const res = await add(u, v(expired), 2);
      const s = res.body.items.find((i: any) => i.productId === sale.id);
      expect(s).toMatchObject({ price: 1_000_000, salePrice: 800_000, discountPercent: 20, unitPrice: 800_000, quantity: 3, lineTotal: 2_400_000 });
      const e = res.body.items.find((i: any) => i.productId === expired.id);
      expect(e).toMatchObject({ salePrice: null, unitPrice: 500_000, lineTotal: 1_000_000 });
      expect(res.body.subtotal).toBe(3_400_000);
    });

    it('PATCH số lượng tuyệt đối, kiểm tra tồn/ngưỡng, dòng người khác 404', async () => {
      const u = await mkUser();
      const other = await mkUser();
      const item = (await add(u, v(ctx.M, 0), 2)).body.items[0];
      const r = await call('patch', `/cart/items/${item.id}`, u.token, { quantity: 4 });
      expect(r.status).toBe(200);
      expect(r.body.items[0].quantity).toBe(4); // tuyệt đối, không cộng dồn
      expect((await call('patch', `/cart/items/${item.id}`, u.token, { quantity: 1 })).body.items[0].quantity).toBe(1);
      const over = await call('patch', `/cart/items/${item.id}`, u.token, { quantity: 6 }); // tồn 5
      expectErr(over, 409, 'INSUFFICIENT_STOCK');
      expect(over.body.available).toBe(5);
      expectErr(await call('patch', `/cart/items/${item.id}`, u.token, { quantity: 11 }), 400, 'VALIDATION_ERROR');
      expectErr(await call('patch', `/cart/items/${item.id}`, u.token, { quantity: 0 }), 400, 'VALIDATION_ERROR');
      expectErr(await call('patch', `/cart/items/${item.id}`, other.token, { quantity: 2 }), 404, 'NOT_FOUND');
      expectErr(await call('patch', '/cart/items/999999999', u.token, { quantity: 2 }), 404, 'NOT_FOUND');
      expect((await cart(u)).items[0].quantity).toBe(1);
    });

    it('PATCH vượt ngưỡng 10 khi tồn đủ -> 400 QUANTITY_LIMIT_EXCEEDED hoặc VALIDATION_ERROR', async () => {
      const u = await mkUser();
      const p = await mkProduct(ctx.cat.id, { variants: [{ sku: `${CODE}-PL-${n()}`, size: '', stock: 50 }] });
      const item = (await add(u, v(p))).body.items[0];
      const res = await call('patch', `/cart/items/${item.id}`, u.token, { quantity: 11 });
      expect(res.status).toBe(400);
    });

    it('DELETE một dòng (404 nếu không có / của người khác), POST remove nhiều dòng, DELETE /cart', async () => {
      const u = await mkUser();
      const other = await mkUser();
      await add(u, v(ctx.S1));
      await add(u, v(ctx.M, 0));
      const otherItem = (await add(other, v(ctx.S1))).body.items[0];
      const c = await cart(u);
      const [first, second] = c.items;
      const del = await call('delete', `/cart/items/${first.id}`, u.token);
      expect(del.status).toBe(200);
      expect(del.body.items.map((i: any) => i.id)).toEqual([second.id]);
      expectErr(await call('delete', `/cart/items/${first.id}`, u.token), 404, 'NOT_FOUND');
      expectErr(await call('delete', `/cart/items/${otherItem.id}`, u.token), 404, 'NOT_FOUND');

      await add(u, v(ctx.M, 0));
      // id của người khác bị bỏ qua, không ảnh hưởng giỏ của họ
      const rem = await call('post', '/cart/items/remove', u.token, { itemIds: [second.id, otherItem.id, 999999999] });
      expect(rem.status).toBe(200);
      expect(rem.body.items.map((i: any) => i.variantId)).toEqual([v(ctx.M, 0)]);
      expect((await cart(other)).items).toHaveLength(1);
      expectErr(await call('post', '/cart/items/remove', u.token, { itemIds: [] }), 400, 'VALIDATION_ERROR');
      expectErr(await call('post', '/cart/items/remove', u.token, { itemIds: Array.from({ length: 51 }, (_, i) => i + 1) }), 400, 'VALIDATION_ERROR');

      await add(u, v(ctx.S1));
      expect((await call('delete', '/cart', u.token)).status).toBe(204);
      expect((await cart(u)).items).toHaveLength(0);
      expect((await cart(other)).items).toHaveLength(1);
      expect((await call('delete', '/cart', u.token)).status).toBe(204); // idempotent
    });

    it('20 request thêm song song cùng biến thể: đúng ngưỡng 10, không 5xx, một giỏ', async () => {
      const u = await mkUser();
      const p = await mkProduct(ctx.cat.id, { variants: [{ sku: `${CODE}-CC-${n()}`, size: '', stock: 100 }] });
      const rs = await Promise.all(Array.from({ length: 20 }, () => add(u, v(p))));
      expect(rs.filter((r) => r.status >= 500)).toHaveLength(0);
      expect(rs.filter((r) => r.status === 200 || r.status === 201)).toHaveLength(10);
      expect(rs.filter((r) => r.status === 400 && r.body.code === 'QUANTITY_LIMIT_EXCEEDED')).toHaveLength(10);
      const c = await cart(u);
      expect(c.items).toHaveLength(1);
      expect(c.items[0].quantity).toBe(10);
      expect(await cartRows(u.id)).toBe(1);
    });

    it('tồn 3, 8 request thêm song song -> tổng trong giỏ không vượt tồn', async () => {
      const u = await mkUser();
      const p = await mkProduct(ctx.cat.id, { variants: [{ sku: `${CODE}-CS-${n()}`, size: '', stock: 3 }] });
      const rs = await Promise.all(Array.from({ length: 8 }, () => add(u, v(p))));
      expect(rs.filter((r) => r.status >= 500)).toHaveLength(0);
      expect(rs.filter((r) => r.status === 200 || r.status === 201)).toHaveLength(3);
      expect((await cart(u)).items[0].quantity).toBe(3);
    });

    it('6 request đầu tiên của user mới song song (khác biến thể) -> không lỗi tạo giỏ trùng', async () => {
      const u = await mkUser();
      const prods = await Promise.all(Array.from({ length: 6 }, () => mkProduct(ctx.cat.id)));
      const rs = await Promise.all(prods.map((p) => add(u, v(p))));
      expect(rs.filter((r) => r.status >= 500)).toHaveLength(0);
      expect(rs.every((r) => r.status === 200 || r.status === 201)).toBe(true);
      expect(await cartRows(u.id)).toBe(1);
      expect((await cart(u)).items).toHaveLength(6);
      // user mới khác: 6 request cùng biến thể
      const u2 = await mkUser();
      const rs2 = await Promise.all(Array.from({ length: 6 }, () => add(u2, v(ctx.S1))));
      expect(rs2.filter((r) => r.status >= 500)).toHaveLength(0);
      expect(await cartRows(u2.id)).toBe(1);
      expect((await cart(u2)).items[0].quantity).toBe(5); // tồn 5 của S1
    }, 60_000);

    it('giỏ của người khác không truy cập được; mỗi user một giỏ riêng', async () => {
      const a = await mkUser();
      const b = await mkUser();
      const item = (await add(a, v(ctx.S1))).body.items[0];
      expect((await cart(b)).items).toHaveLength(0);
      expectErr(await call('patch', `/cart/items/${item.id}`, b.token, { quantity: 2 }), 404, 'NOT_FOUND');
      expectErr(await call('delete', `/cart/items/${item.id}`, b.token), 404, 'NOT_FOUND');
      expect((await cart(a)).items[0].quantity).toBe(1);
    });
  });
});
