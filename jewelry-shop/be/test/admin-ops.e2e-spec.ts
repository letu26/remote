import { readFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
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
const DAY = 86_400_000;
let seq = 0;
const n = () => ++seq;

let app: INestApplication;
let db: mysql.Connection;
let adminToken = '';
let adminId = 0;
let cat: { id: number };

const noStorage = { isConfigured: () => false, upload: async () => { throw new Error('off'); }, delete: async () => undefined };
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
const call = (method: Method, path: string, token?: string, body?: object) => {
  const r = request(app.getHttpServer())[method](`/api${path}`);
  if (token) r.set('Authorization', `Bearer ${token}`);
  return body ? r.send(body) : r;
};
const adm = (method: Method, path: string, body?: object) => call(method, path, adminToken, body);
function expectErr(res: request.Response, status: number, code: string) {
  expect(res.status, JSON.stringify(res.body)).toBe(status);
  expect(res.body.code).toBe(code);
}
const fieldsOf = (res: request.Response): string[] => (res.body.details ?? []).map((d: { field: string }) => d.field);

interface TU { id: number; token: string; phone: string; email: string; name: string }
async function loginPhone(phone: string, password = PASSWORD) {
  return request(app.getHttpServer()).post('/api/auth/login').send({ phone, password });
}
async function mkUser(role: 'admin' | 'user' = 'user', fullName = `${NAME} user ${n()}`): Promise<TU> {
  const email = `e2e-ops-${runId}-${n()}@e2e.test`;
  const phone = '0993' + String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
  const hash = await bcrypt.hash(PASSWORD, 4);
  const [r] = await db.query<mysql.ResultSetHeader>(
    'INSERT INTO users (fullName,email,phone,passwordHash,role,status) VALUES (?,?,?,?,?,?)', [fullName, email, phone, hash, role, 'active'],
  );
  const res = await loginPhone(phone);
  expect(res.status).toBe(200);
  return { id: r.insertId, token: res.body.accessToken, phone, email, name: fullName };
}
async function mkCategory() {
  const res = await adm('post', '/admin/categories', { name: `${NAME} cat ${n()}` });
  expect(res.status).toBe(201);
  return res.body as { id: number };
}
async function mkProduct(over: Record<string, unknown> = {}) {
  const i = n();
  const res = await adm('post', '/admin/products', {
    code: `${CODE}-${String(i).padStart(3, '0')}`, name: `${NAME} P${i}`, categoryId: cat.id, price: 1_000_000,
    variants: [{ sku: `${CODE}-${i}-A`, size: '', stock: 10 }], ...over,
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as any;
}
let shipId = 0;
interface OrderOpts {
  status: string; total: number; createdAt: Date; deliveredAt?: Date;
  items?: Array<{ product: any; qty: number; lineTotal: number }>;
}
async function insertOrder(userId: number, o: OrderOpts) {
  const code = `TMP-E2E-OP-${runId}-${n()}`;
  const [r] = await db.query<mysql.ResultSetHeader>(
    `INSERT INTO orders (code,userId,receiverName,receiverPhone,provinceName,wardName,addressDetail,shippingMethodId,shippingMethodName,subtotal,shippingFee,total,paymentMethod,status,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [code, userId, 'E2E', '0911111111', 'P', 'W', 'A', shipId, 'x', o.total, 0, o.total, 'cod', o.status, o.createdAt],
  );
  for (const it of o.items ?? []) {
    const v = it.product.variants[0];
    await db.query(
      'INSERT INTO order_items (orderId,variantId,productName,productCode,size,unitPrice,quantity,lineTotal) VALUES (?,?,?,?,?,?,?,?)',
      [r.insertId, v.id, it.product.name, it.product.code, '', 1, it.qty, it.lineTotal],
    );
  }
  await db.query('INSERT INTO order_status_history (orderId,status,createdAt) VALUES (?,?,?)', [r.insertId, 'pending', o.createdAt]);
  if (o.deliveredAt) await db.query('INSERT INTO order_status_history (orderId,status,createdAt) VALUES (?,?,?)', [r.insertId, 'delivered', o.deliveredAt]);
  else if (o.status === 'cancelled') await db.query('INSERT INTO order_status_history (orderId,status,createdAt) VALUES (?,?,?)', [r.insertId, 'cancelled', o.createdAt]);
  return { id: r.insertId, code };
}
const utc = (s: string) => new Date(`${s}Z`);

async function cleanup() {
  const sub = "(SELECT id FROM users WHERE email LIKE '%@e2e.test')";
  await db.query(`DELETE FROM reviews WHERE userId IN ${sub}`);
  const ord = `(SELECT id FROM orders WHERE userId IN ${sub})`;
  await db.query(`DELETE FROM order_status_history WHERE orderId IN ${ord}`);
  await db.query(`DELETE FROM order_items WHERE orderId IN ${ord}`);
  await db.query(`DELETE FROM orders WHERE userId IN ${sub}`);
  await db.query(`DELETE FROM cart_items WHERE cartId IN (SELECT id FROM carts WHERE userId IN ${sub})`);
  await db.query(`DELETE FROM carts WHERE userId IN ${sub}`);
  await db.query(`DELETE FROM addresses WHERE userId IN ${sub}`);
  await db.query(`DELETE FROM wishlists WHERE userId IN ${sub}`);
  await db.query(`DELETE FROM token_blacklist WHERE userId IN ${sub}`);
  await db.query("DELETE FROM promotions WHERE name LIKE 'TMP E2E%'");
  await db.query("DELETE FROM shipping_methods WHERE name LIKE 'TMP E2E%'");
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
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { ca: readFileSync(process.env.DB_SSL_CA as string, 'utf8') } : undefined,
    charset: 'utf8mb4', timezone: 'Z',
  });
  await cleanup();
  const m = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ImageStorage).useValue(noStorage).overrideProvider(MailService).useValue({ sendOtpMail: () => undefined, sendOrderPaidMail: () => undefined, sendOrderDeliveredMail: () => undefined }).compile();
  app = m.createNestApplication();
  configureApp(app);
  await app.init();
  const admin = await mkUser('admin', `${NAME} admin`);
  adminId = admin.id;
  adminToken = admin.token;
  cat = await mkCategory();
  const [s] = await db.query<mysql.ResultSetHeader>('INSERT INTO shipping_methods (name,fee) VALUES (?,0)', [`${NAME} ship`]);
  shipId = s.insertId;
}, 120_000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await app?.close();
    await db?.end();
  }
}, 90_000);

// ===================================================================
describe('Phân quyền', () => {
  const eps: Array<[Method, string]> = [
    ['get', '/admin/promotions'], ['post', '/admin/promotions'], ['patch', '/admin/promotions/1'], ['delete', '/admin/promotions/1'],
    ['get', '/admin/customers'], ['get', '/admin/customers/1'], ['patch', '/admin/customers/1/status'], ['patch', '/admin/customers/1/role'],
    ['get', '/admin/stats/overview'], ['get', '/admin/stats/revenue'], ['get', '/admin/stats/orders-by-status'],
    ['get', '/admin/stats/top-products'], ['get', '/admin/stats/low-stock'], ['get', '/admin/stats/top-customers'],
  ];
  it.each(eps)('%s %s: 401 không token, 403 role user', async (m, p) => {
    const user = await mkUser();
    expect((await call(m, p)).status).toBe(401);
    expect((await call(m, p, user.token, {})).status).toBe(403);
  });
});

// ===================================================================
describe('Khuyến mại', () => {
  const inDays = (d: number) => new Date(Date.now() + d * DAY).toISOString();
  const promoBody = (productIds: number[], over: Record<string, unknown> = {}) => ({
    name: `${NAME} promo ${n()}`, productIds, discountPercent: 20, startsAt: inDays(-1), endsAt: inDays(1), ...over,
  });
  const createPromo = async (productIds: number[], over: Record<string, unknown> = {}) => {
    const res = await adm('post', '/admin/promotions', promoBody(productIds, over));
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body as { created: number; items: any[] };
  };
  const promoCount = async (like: string) =>
    ((await db.query<mysql.RowDataPacket[]>('SELECT COUNT(*) n FROM promotions WHERE name LIKE ?', [like]))[0][0].n as number);
  const price = async (p: any) => {
    const r = await call('get', `/products/${p.slug}`);
    return { salePrice: r.body.salePrice, discountPercent: r.body.discountPercent };
  };

  it('tạo nhiều sản phẩm trong một lần, item đủ trường, status đúng', async () => {
    const p1 = await mkProduct();
    const p2 = await mkProduct();
    const res = await createPromo([p1.id, p2.id], { name: `${NAME} multi` });
    expect(res.created).toBe(2);
    expect(res.items).toHaveLength(2);
    for (const it of res.items) {
      for (const k of ['id', 'name', 'productId', 'productCode', 'productName', 'discountPercent', 'startsAt', 'endsAt', 'isActive', 'status', 'createdAt']) expect(it).toHaveProperty(k);
      expect(it.status).toBe('active');
      expect(it.startsAt).toMatch(/Z$/);
      expect(it.endsAt).toMatch(/Z$/);
    }
    expect(res.items.map((i) => i.productCode).sort()).toEqual([p1.code, p2.code].sort());
    expect(res.items[0].productName).toMatch(/TMP E2E/);
  });

  it('status ưu tiên disabled > expired > upcoming > active; lọc ở SQL kể cả khi phân trang nhiều trang', async () => {
    const p = await mkProduct();
    const tag = `${NAME} st${n()}`;
    const mk = (name: string, s: number, e: number, isActive = true) => createPromo([p.id], { name: `${tag} ${name}`, startsAt: inDays(s), endsAt: inDays(e), isActive });
    const active: number[] = [];
    const upcoming: number[] = [];
    const expired: number[] = [];
    const disabled: number[] = [];
    for (let i = 0; i < 5; i++) active.push((await mk(`a${i}`, -1, 1)).items[0].id);
    for (let i = 0; i < 3; i++) upcoming.push((await mk(`u${i}`, 1, 2)).items[0].id);
    for (let i = 0; i < 4; i++) expired.push((await mk(`e${i}`, -3, -2)).items[0].id);
    disabled.push((await mk('d-active-window', -1, 1, false)).items[0].id);
    disabled.push((await mk('d-expired-window', -3, -2, false)).items[0].id);
    disabled.push((await mk('d-upcoming-window', 1, 2, false)).items[0].id);
    const all = await adm('get', `/admin/promotions?q=${encodeURIComponent(tag)}&pageSize=100`);
    expect(all.body.total).toBe(15);
    const byId = Object.fromEntries(all.body.items.map((i: any) => [i.id, i.status]));
    for (const id of active) expect(byId[id]).toBe('active');
    for (const id of upcoming) expect(byId[id]).toBe('upcoming');
    for (const id of expired) expect(byId[id]).toBe('expired');
    for (const id of disabled) expect(byId[id]).toBe('disabled');
    // mới tạo trước
    const ids = all.body.items.map((i: any) => i.id);
    expect(ids).toEqual([...ids].sort((a: number, b: number) => b - a));
    for (const [status, expected] of [['active', active], ['upcoming', upcoming], ['expired', expired], ['disabled', disabled]] as const) {
      const collected: number[] = [];
      let page = 1;
      for (;;) {
        const r = await adm('get', `/admin/promotions?q=${encodeURIComponent(tag)}&status=${status}&pageSize=2&page=${page}`);
        expect(r.body.total, status).toBe(expected.length);
        expect(r.body.totalPages, status).toBe(Math.ceil(expected.length / 2));
        collected.push(...r.body.items.map((i: any) => i.id));
        expect(r.body.items.every((i: any) => i.status === status)).toBe(true);
        if (page >= r.body.totalPages) break;
        page++;
      }
      expect(collected.sort((a, b) => a - b), status).toEqual([...expected].sort((a, b) => a - b));
    }
    expect((await adm('get', '/admin/promotions?status=bogus')).status).toBe(400);
    const byProduct = await adm('get', `/admin/promotions?productId=${p.id}&pageSize=100`);
    expect(byProduct.body.total).toBe(15);
    expect((await adm('get', '/admin/promotions?pageSize=500')).body.pageSize).toBe(100);
    expect((await adm('get', '/admin/promotions')).body).toMatchObject({ page: 1, pageSize: 20 });
  });

  it('q khớp tên khuyến mại, tên sản phẩm, mã sản phẩm (không phân biệt hoa thường)', async () => {
    const p = await mkProduct({ name: `${NAME} Nhẫn Đặc Biệt ${n()}` });
    const r = await createPromo([p.id], { name: `${NAME} KhuyenMaiRieng${n()}` });
    const name = r.items[0].name as string;
    for (const q of [name.toLowerCase(), p.code.toLowerCase(), p.name.toUpperCase()]) {
      const res = await adm('get', `/admin/promotions?q=${encodeURIComponent(q)}&pageSize=100`);
      expect(res.body.items.map((i: any) => i.id), q).toContain(r.items[0].id);
    }
  });

  it('POST validate: productIds trùng/không tồn tại/quá 100; discountPercent; thời gian; không tạo dòng nào khi lỗi', async () => {
    const p = await mkProduct();
    const tag = `${NAME} bad${n()}`;
    const bad = async (over: Record<string, unknown>, field: string) => {
      const res = await adm('post', '/admin/promotions', promoBody([p.id], { name: tag, ...over }));
      expectErr(res, 400, 'VALIDATION_ERROR');
      expect(fieldsOf(res), JSON.stringify(over)).toContain(field);
      return res;
    };
    await bad({ productIds: [p.id, p.id] }, 'productIds');
    const missing = await bad({ productIds: [p.id, 999999999] }, 'productIds');
    expect(JSON.stringify(missing.body.details)).toContain('999999999');
    await bad({ productIds: Array.from({ length: 101 }, (_, i) => i + 1) }, 'productIds');
    await bad({ productIds: [] }, 'productIds');
    for (const d of [0, 91, 10.5, -5, 'abc']) await bad({ discountPercent: d }, 'discountPercent');
    await bad({ startsAt: inDays(1), endsAt: inDays(-1) }, 'endsAt');
    const same = inDays(1);
    await bad({ startsAt: same, endsAt: same }, 'endsAt');
    await bad({ startsAt: 'ngày mai' }, 'startsAt');
    await bad({ endsAt: '2030-01-01 10:00' }, 'endsAt');
    await bad({ endsAt: '2030-01-01' }, 'endsAt');
    await bad({ name: '' }, 'name');
    await bad({ name: 'x'.repeat(151) }, 'name');
    expect(await promoCount(`${tag}%`)).toBe(0);
    // một id không tồn tại -> không tạo gì kể cả các id hợp lệ
    const ok = await mkProduct();
    const t2 = `${NAME} atomic${n()}`;
    expectErr(await adm('post', '/admin/promotions', promoBody([ok.id, p.id, 999999999], { name: t2 })), 400, 'VALIDATION_ERROR');
    expect(await promoCount(`${t2}%`)).toBe(0);
    // đúng 100 id hợp lệ chấp nhận (dùng lặp lại 1 sản phẩm không được, nên chỉ kiểm tra biên 100 qua id không tồn tại -> vẫn 400 chứ không phải lỗi khác)
  });

  it('múi giờ: +07:00 và Z quy đổi đúng cùng một thời điểm', async () => {
    const p = await mkProduct();
    const a = (await createPromo([p.id], { startsAt: '2030-01-01T07:00:00+07:00', endsAt: '2030-01-02T07:00:00+07:00' })).items[0];
    const b = (await createPromo([p.id], { startsAt: '2030-01-01T00:00:00Z', endsAt: '2030-01-02T00:00:00.000Z' })).items[0];
    for (const it of [a, b]) {
      expect(it.startsAt).toBe('2030-01-01T00:00:00.000Z');
      expect(it.endsAt).toBe('2030-01-02T00:00:00.000Z');
      const [[row]] = await db.query<mysql.RowDataPacket[]>('SELECT startsAt, endsAt FROM promotions WHERE id=?', [it.id]);
      expect(new Date(row.startsAt).toISOString()).toBe('2030-01-01T00:00:00.000Z');
    }
    expect(a.status).toBe('upcoming');
  });

  it('PATCH: kiểm tra startsAt < endsAt trên giá trị gộp, không đổi productId, bật/tắt; DELETE', async () => {
    const p = await mkProduct();
    const other = await mkProduct();
    const it = (await createPromo([p.id], { startsAt: inDays(-1), endsAt: inDays(2) })).items[0];
    const upd = await adm('patch', `/admin/promotions/${it.id}`, { name: `${NAME} renamed ${n()}`, discountPercent: 35, productId: other.id, id: 1 });
    expect(upd.status, JSON.stringify(upd.body)).toBe(200);
    expect(upd.body).toMatchObject({ discountPercent: 35, productId: p.id, status: 'active' });
    // endsAt trước startsAt hiện có
    const e1 = await adm('patch', `/admin/promotions/${it.id}`, { endsAt: inDays(-2) });
    expectErr(e1, 400, 'VALIDATION_ERROR');
    expect(fieldsOf(e1)).toContain('endsAt');
    // startsAt sau endsAt hiện có
    expect((await adm('patch', `/admin/promotions/${it.id}`, { startsAt: inDays(5) })).status).toBe(400);
    // đổi cả hai hợp lệ
    const both = await adm('patch', `/admin/promotions/${it.id}`, { startsAt: inDays(5), endsAt: inDays(6) });
    expect(both.body.status).toBe('upcoming');
    const off = await adm('patch', `/admin/promotions/${it.id}`, { isActive: false });
    expect(off.body).toMatchObject({ isActive: false, status: 'disabled' });
    expect((await adm('patch', `/admin/promotions/${it.id}`, { isActive: true })).body.status).toBe('upcoming');
    expectErr(await adm('patch', `/admin/promotions/${it.id}`, { discountPercent: 95 }), 400, 'VALIDATION_ERROR');
    expectErr(await adm('patch', '/admin/promotions/999999999', { isActive: false }), 404, 'NOT_FOUND');
    expect((await adm('delete', `/admin/promotions/${it.id}`)).status).toBe(204);
    expectErr(await adm('delete', `/admin/promotions/${it.id}`), 404, 'NOT_FOUND');
  });

  it('hiệu ứng lên giá khách: tạo / sửa / tắt / xóa đổi salePrice ngay (chi tiết, onSale, giỏ)', async () => {
    const p = await mkProduct({ price: 1_000_000 });
    const customer = await mkUser();
    const q = encodeURIComponent(p.code);
    const onSale = async () => (await call('get', `/products?q=${q}&onSale=true`)).body.items.map((i: any) => i.id);
    const cartLine = async () => {
      const r = await call('get', '/cart', customer.token);
      return r.body.items.find((i: any) => i.productId === p.id);
    };
    await call('post', '/cart/items', customer.token, { variantId: p.variants[0].id, quantity: 1 });
    expect(await price(p)).toEqual({ salePrice: null, discountPercent: null });
    expect(await onSale()).not.toContain(p.id);
    expect((await cartLine()).unitPrice).toBe(1_000_000);

    const promo = (await createPromo([p.id], { discountPercent: 20 })).items[0];
    expect(await price(p)).toEqual({ salePrice: 800_000, discountPercent: 20 });
    expect(await onSale()).toContain(p.id);
    expect(await cartLine()).toMatchObject({ unitPrice: 800_000, salePrice: 800_000, discountPercent: 20 });
    const listed = (await call('get', `/products?q=${q}`)).body.items[0];
    expect(listed).toMatchObject({ salePrice: 800_000, discountPercent: 20 });

    await adm('patch', `/admin/promotions/${promo.id}`, { discountPercent: 50 });
    expect(await price(p)).toEqual({ salePrice: 500_000, discountPercent: 50 });
    expect((await cartLine()).unitPrice).toBe(500_000);

    await adm('patch', `/admin/promotions/${promo.id}`, { isActive: false });
    expect(await price(p)).toEqual({ salePrice: null, discountPercent: null });
    expect(await onSale()).not.toContain(p.id);
    expect((await cartLine()).unitPrice).toBe(1_000_000);

    await adm('patch', `/admin/promotions/${promo.id}`, { isActive: true });
    expect((await price(p)).salePrice).toBe(500_000);
    expect((await adm('delete', `/admin/promotions/${promo.id}`)).status).toBe(204);
    expect(await price(p)).toEqual({ salePrice: null, discountPercent: null });
    expect((await cartLine()).unitPrice).toBe(1_000_000);
  });

  it('hai khuyến mại chồng nhau lấy mức giảm cao nhất; chưa tới hạn / hết hạn không áp dụng', async () => {
    const p = await mkProduct({ price: 1_000_000 });
    await createPromo([p.id], { discountPercent: 10 });
    const high = (await createPromo([p.id], { discountPercent: 30 })).items[0];
    await createPromo([p.id], { discountPercent: 60, startsAt: inDays(1), endsAt: inDays(2) }); // chưa tới
    await createPromo([p.id], { discountPercent: 70, startsAt: inDays(-3), endsAt: inDays(-2) }); // hết hạn
    await createPromo([p.id], { discountPercent: 80, isActive: false }); // tắt
    expect(await price(p)).toEqual({ salePrice: 700_000, discountPercent: 30 });
    await adm('patch', `/admin/promotions/${high.id}`, { isActive: false });
    expect(await price(p)).toEqual({ salePrice: 900_000, discountPercent: 10 });
  });
});

// ===================================================================
describe('Quản lý khách hàng', () => {
  const listBy = async (q: string, extra = '') => (await adm('get', `/admin/customers?q=${encodeURIComponent(q)}&pageSize=100${extra}`)).body;

  it('list: tìm theo họ tên / SĐT / email, lọc status & role, phân trang; chỉ số đơn; không lộ passwordHash', async () => {
    const p = await mkProduct();
    const u = await mkUser('user', `${NAME} Khách Chỉ Số`);
    const empty = await mkUser('user', `${NAME} Khách Trống`);
    const base = Date.now() - 20 * DAY;
    await insertOrder(u.id, { status: 'cancelled', total: 50_000, createdAt: new Date(base - DAY), items: [{ product: p, qty: 1, lineTotal: 50_000 }] });
    await insertOrder(u.id, { status: 'delivered', total: 1_000_000, createdAt: new Date(base), deliveredAt: new Date(base + DAY) });
    const lastPending = new Date(base + 5 * DAY);
    await insertOrder(u.id, { status: 'pending', total: 200_000, createdAt: lastPending });
    await insertOrder(u.id, { status: 'delivered', total: 300_000, createdAt: new Date(base + 2 * DAY), deliveredAt: new Date(base + 3 * DAY) });

    const byName = await listBy('khách chỉ số');
    const row = byName.items.find((i: any) => i.id === u.id);
    expect(row).toMatchObject({ id: u.id, fullName: u.name, phone: u.phone, email: u.email, role: 'user', status: 'active', orderCount: 3, totalSpent: 1_300_000 });
    expect(row.lastOrderAt).toBe(lastPending.toISOString());
    expect(row.createdAt).toMatch(/Z$/);
    expect(Object.keys(row).sort()).toEqual(['createdAt', 'email', 'fullName', 'id', 'lastOrderAt', 'orderCount', 'phone', 'role', 'status', 'totalSpent']);
    const e = (await listBy('khách trống')).items.find((i: any) => i.id === empty.id);
    expect(e).toMatchObject({ orderCount: 0, totalSpent: 0, lastOrderAt: null });
    expect((await listBy(u.phone)).items.map((i: any) => i.id)).toEqual([u.id]);
    expect((await listBy(u.email.toUpperCase())).items.map((i: any) => i.id)).toEqual([u.id]);
    expect((await listBy(u.phone.slice(0, 8) )).items.map((i: any) => i.id)).toContain(u.id);
    await db.query("UPDATE users SET status='locked' WHERE id=?", [empty.id]);
    expect((await listBy(NAME, '&status=locked')).items.map((i: any) => i.id)).toEqual([empty.id]);
    expect((await listBy(NAME, '&status=active')).items.map((i: any) => i.id)).not.toContain(empty.id);
    const admins = await listBy(NAME, '&role=admin');
    expect(admins.items.every((i: any) => i.role === 'admin')).toBe(true);
    expect(admins.items.map((i: any) => i.id)).toContain(adminId);
    expect((await listBy(NAME, '&role=user')).items.map((i: any) => i.id)).not.toContain(adminId);
    expect((await listBy(NAME)).items.map((i: any) => i.id)).toEqual(expect.arrayContaining([adminId, u.id, empty.id]));
    // mới đăng ký trước
    const ids = (await listBy(NAME)).items.map((i: any) => i.id);
    expect(ids).toEqual([...ids].sort((a: number, b: number) => b - a));
    const pg = await adm('get', `/admin/customers?q=${encodeURIComponent(NAME)}&pageSize=2&page=2`);
    expect(pg.body).toMatchObject({ page: 2, pageSize: 2 });
    expect((await adm('get', '/admin/customers?pageSize=500')).body.pageSize).toBe(100);
    expect((await adm('get', '/admin/customers')).body).toMatchObject({ page: 1, pageSize: 20 });
    expect((await adm('get', '/admin/customers?status=bogus')).status).toBe(400);
    expect((await adm('get', '/admin/customers?role=manager')).status).toBe(400);
    expect(JSON.stringify(byName)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });

  it('chi tiết: addressCount, reviewCount, wishlistCount, recentOrders tối đa 10 có id; 404; không lộ passwordHash', async () => {
    const p = await mkProduct();
    const u = await mkUser();
    const [pr] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM provinces LIMIT 1');
    const [wd] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM wards WHERE provinceId=? LIMIT 1', [pr[0].id]);
    for (let i = 0; i < 2; i++) {
      await db.query('INSERT INTO addresses (userId,receiverName,receiverPhone,provinceId,wardId,detail,isDefault) VALUES (?,?,?,?,?,?,?)',
        [u.id, 'A', '0912345678', pr[0].id, wd[0].id, 'dia chi test', i === 0 ? 1 : 0]);
    }
    await db.query('INSERT INTO wishlists (userId,productId) VALUES (?,?)', [u.id, p.id]);
    const base = Date.now() - 30 * DAY;
    const orders = [];
    for (let i = 0; i < 12; i++) {
      orders.push(await insertOrder(u.id, { status: 'pending', total: 1000 * (i + 1), createdAt: new Date(base + i * DAY), items: i === 11 ? [{ product: p, qty: 1, lineTotal: 1000 }, { product: p, qty: 1, lineTotal: 1000 }] : [] }));
    }
    const [oi] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM order_items WHERE orderId=? LIMIT 1', [orders[11].id]);
    await db.query('INSERT INTO reviews (userId,productId,orderItemId,rating,comment) VALUES (?,?,?,?,?)', [u.id, p.id, oi[0].id, 4, 'ok']);
    const res = await adm('get', `/admin/customers/${u.id}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body).toMatchObject({ id: u.id, addressCount: 2, reviewCount: 1, wishlistCount: 1, orderCount: 12 });
    expect(res.body.recentOrders).toHaveLength(10);
    expect(res.body.recentOrders.map((o: any) => o.id)).toEqual([...orders].reverse().slice(0, 10).map((o) => o.id));
    expect(Object.keys(res.body.recentOrders[0]).sort()).toEqual(['code', 'createdAt', 'id', 'itemCount', 'paymentStatus', 'status', 'total']);
    expect(res.body.recentOrders[0].itemCount).toBe(2);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    expectErr(await adm('get', '/admin/customers/999999999'), 404, 'NOT_FOUND');
  });

  it('khóa user: token cũ bị 403 ACCOUNT_LOCKED ngay, đăng nhập mới bị chặn; mở khóa dùng lại được; lặp lại vẫn 200', async () => {
    const u = await mkUser();
    expect((await call('get', '/users/me', u.token)).status).toBe(200);
    const lock = await adm('patch', `/admin/customers/${u.id}/status`, { status: 'locked', reason: 'vi phạm' });
    expect(lock.status, JSON.stringify(lock.body)).toBe(200);
    expect(lock.body).toMatchObject({ id: u.id, status: 'locked' });
    expect(lock.body).toHaveProperty('orderCount');
    expectErr(await call('get', '/users/me', u.token), 403, 'ACCOUNT_LOCKED');
    expectErr(await loginPhone(u.phone), 403, 'ACCOUNT_LOCKED');
    expect((await adm('patch', `/admin/customers/${u.id}/status`, { status: 'locked' })).status).toBe(200);
    const unlock = await adm('patch', `/admin/customers/${u.id}/status`, { status: 'active' });
    expect(unlock.body.status).toBe('active');
    expect((await loginPhone(u.phone)).status).toBe(200);
    expect((await call('get', '/users/me', u.token)).status).toBe(200);
    expect((await adm('patch', `/admin/customers/${u.id}/status`, { status: 'active' })).status).toBe(200);
  });
  it('khóa: admin khác -> CANNOT_LOCK_ADMIN, tự khóa -> CANNOT_MODIFY_SELF, id lạ 404, giá trị sai 400', async () => {
    const other = await mkUser('admin');
    expectErr(await adm('patch', `/admin/customers/${other.id}/status`, { status: 'locked' }), 409, 'CANNOT_LOCK_ADMIN');
    expectErr(await adm('patch', `/admin/customers/${adminId}/status`, { status: 'locked' }), 409, 'CANNOT_MODIFY_SELF');
    expectErr(await adm('patch', '/admin/customers/999999999/status', { status: 'locked' }), 404, 'NOT_FOUND');
    const u = await mkUser();
    expectErr(await adm('patch', `/admin/customers/${u.id}/status`, { status: 'banned' }), 400, 'VALIDATION_ERROR');
    expectErr(await adm('patch', `/admin/customers/${u.id}/status`, {}), 400, 'VALIDATION_ERROR');
    expectErr(await adm('patch', `/admin/customers/${u.id}/status`, { status: 'locked', reason: 'x'.repeat(256) }), 400, 'VALIDATION_ERROR');
    expect((await call('get', '/users/me', other.token)).status).toBe(200);
  });
  it('đổi quyền: nâng user lên admin thu hồi token cũ, đăng nhập lại có quyền mới; hạ quyền; tự đổi 409; giá trị sai 400', async () => {
    const u = await mkUser();
    expect((await call('get', '/admin/stats/low-stock?limit=1', u.token)).status).toBe(403);
    const up = await adm('patch', `/admin/customers/${u.id}/role`, { role: 'admin' });
    expect(up.status, JSON.stringify(up.body)).toBe(200);
    expect(up.body.role).toBe('admin');
    expectErr(await call('get', '/users/me', u.token), 401, 'TOKEN_REVOKED');
    const relog = await loginPhone(u.phone);
    expect(relog.status).toBe(200);
    expect(relog.body.user.role).toBe('admin');
    expect((await call('get', '/admin/stats/low-stock?limit=1', relog.body.accessToken)).status).toBe(200);
    // đặt cùng giá trị: vẫn 200
    expect((await adm('patch', `/admin/customers/${u.id}/role`, { role: 'admin' })).status).toBe(200);
    // hạ quyền (còn admin thật nên không phải admin cuối)
    const down = await adm('patch', `/admin/customers/${u.id}/role`, { role: 'user' });
    expect(down.status, JSON.stringify(down.body)).toBe(200);
    expect(down.body.role).toBe('user');
    expect((await call('get', '/admin/stats/low-stock?limit=1', relog.body.accessToken)).status).toBe(401);
    const again = await loginPhone(u.phone);
    expect(again.body.user.role).toBe('user');
    expectErr(await adm('patch', `/admin/customers/${adminId}/role`, { role: 'user' }), 409, 'CANNOT_MODIFY_SELF');
    expectErr(await adm('patch', `/admin/customers/${u.id}/role`, { role: 'manager' }), 400, 'VALIDATION_ERROR');
    expectErr(await adm('patch', `/admin/customers/${u.id}/role`, {}), 400, 'VALIDATION_ERROR');
    expectErr(await adm('patch', '/admin/customers/999999999/role', { role: 'admin' }), 404, 'NOT_FOUND');
  });
  it('hai admin hạ quyền nhau song song: không 5xx, hệ thống vẫn còn admin active', async () => {
    const x = await mkUser('admin');
    const y = await mkUser('admin');
    const rs = await Promise.all([
      call('patch', `/admin/customers/${y.id}/role`, x.token, { role: 'user' }),
      call('patch', `/admin/customers/${x.id}/role`, y.token, { role: 'user' }),
    ]);
    expect(rs.filter((r) => r.status >= 500).map((r) => r.body)).toEqual([]);
    for (const r of rs) expect([200, 401, 403, 409]).toContain(r.status);
    const [[cnt]] = await db.query<mysql.RowDataPacket[]>("SELECT COUNT(*) n FROM users WHERE role='admin' AND status='active'");
    expect(cnt.n).toBeGreaterThanOrEqual(1);
  });
  it('GET /admin/orders?userId= chỉ trả đơn của khách đó, trường cũ không đổi', async () => {
    const a = await mkUser();
    const b = await mkUser();
    const oa = await insertOrder(a.id, { status: 'pending', total: 111_000, createdAt: new Date(Date.now() - DAY) });
    const oa2 = await insertOrder(a.id, { status: 'delivered', total: 222_000, createdAt: new Date(Date.now() - 2 * DAY), deliveredAt: new Date() });
    await insertOrder(b.id, { status: 'pending', total: 333_000, createdAt: new Date() });
    const res = await adm('get', `/admin/orders?userId=${a.id}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items.map((i: any) => i.id)).toEqual([oa.id, oa2.id]);
    expect(Object.keys(res.body.items[0]).sort()).toEqual(['code', 'createdAt', 'id', 'itemCount', 'paymentMethod', 'paymentStatus', 'receiverName', 'receiverPhone', 'status', 'total']);
    expect((await adm('get', `/admin/orders?userId=${a.id}&status=delivered`)).body.items.map((i: any) => i.id)).toEqual([oa2.id]);
    expect((await adm('get', '/admin/orders?userId=abc')).status).toBe(400);
  });
});

// ===================================================================
describe('Thống kê', () => {
  // Dữ liệu cố định năm 2019 (không lẫn dữ liệu thật); mốc UTC, ngày VN = UTC+7.
  const ctx: Record<string, any> = {};
  beforeAll(async () => {
    const [P1, P2, P3] = await Promise.all([mkProduct(), mkProduct(), mkProduct()]);
    const U1 = await mkUser('user', `${NAME} top A`);
    const U2 = await mkUser('user', `${NAME} top B`);
    Object.assign(ctx, { P1, P2, P3, U1, U2 });
    // O1: giao 2019-03-10 16:59:59Z = VN 10/03 23:59:59
    await insertOrder(U1.id, { status: 'delivered', total: 1_000_000, createdAt: utc('2019-03-10 01:00:00'), deliveredAt: utc('2019-03-10 16:59:59'),
      items: [{ product: P1, qty: 2, lineTotal: 600_000 }, { product: P2, qty: 1, lineTotal: 400_000 }] });
    // O2: giao 2019-03-10 17:00:00Z = VN 11/03 00:00:00
    await insertOrder(U1.id, { status: 'delivered', total: 500_000, createdAt: utc('2019-03-10 05:00:00'), deliveredAt: utc('2019-03-10 17:00:00'),
      items: [{ product: P1, qty: 1, lineTotal: 500_000 }, { product: P3, qty: 3, lineTotal: 1_100_000 }] });
    // O3: giao 2019-03-11 03:00Z (VN 11/03)
    await insertOrder(U2.id, { status: 'delivered', total: 2_000_000, createdAt: utc('2019-03-11 01:00:00'), deliveredAt: utc('2019-03-11 03:00:00'),
      items: [{ product: P2, qty: 3, lineTotal: 2_000_000 }] });
    // O4: giao 2019-04-02 05:00Z, tạo 2019-04-02
    await insertOrder(U2.id, { status: 'delivered', total: 300_000, createdAt: utc('2019-04-02 01:00:00'), deliveredAt: utc('2019-04-02 05:00:00'),
      items: [{ product: P1, qty: 1, lineTotal: 300_000 }] });
    // O5 hủy, O6 pending, O7 shipping (không tính doanh thu)
    await insertOrder(U1.id, { status: 'cancelled', total: 700_000, createdAt: utc('2019-03-11 02:00:00'), items: [{ product: P1, qty: 9, lineTotal: 700_000 }] });
    await insertOrder(U2.id, { status: 'pending', total: 100_000, createdAt: utc('2019-03-12 02:00:00'), items: [{ product: P1, qty: 9, lineTotal: 100_000 }] });
    await insertOrder(U1.id, { status: 'shipping', total: 150_000, createdAt: utc('2019-03-12 03:00:00'), items: [{ product: P1, qty: 9, lineTotal: 150_000 }] });
    // O8a giao 2019-02-28 16:59:59Z (VN 28/02), O8b giao 2019-02-28 17:00:00Z (VN 01/03); tạo 2019-02-28 10:00Z
    await insertOrder(U1.id, { status: 'delivered', total: 111_000, createdAt: utc('2019-02-28 10:00:00'), deliveredAt: utc('2019-02-28 16:59:59') });
    await insertOrder(U2.id, { status: 'delivered', total: 222_000, createdAt: utc('2019-02-28 10:00:00'), deliveredAt: utc('2019-02-28 17:00:00'),
      items: [{ product: P2, qty: 1, lineTotal: 222_000 }] });
  }, 60_000);
  const st = async (path: string) => adm('get', `/admin/stats/${path}`);

  it('revenue theo ngày: khớp tính tay, điền kỳ trống bằng 0, ranh giới nửa đêm giờ VN', async () => {
    const res = await st('revenue?granularity=day&from=2019-03-09&to=2019-03-13');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body).toEqual([
      { period: '2019-03-09', orders: 0, revenue: 0 },
      { period: '2019-03-10', orders: 1, revenue: 1_000_000 },
      { period: '2019-03-11', orders: 2, revenue: 2_500_000 },
      { period: '2019-03-12', orders: 0, revenue: 0 },
      { period: '2019-03-13', orders: 0, revenue: 0 },
    ]);
    // mặc định granularity=day
    expect((await st('revenue?from=2019-03-10&to=2019-03-10')).body).toEqual([{ period: '2019-03-10', orders: 1, revenue: 1_000_000 }]);
    const edge = await st('revenue?from=2019-02-28&to=2019-03-01');
    expect(edge.body).toEqual([
      { period: '2019-02-28', orders: 1, revenue: 111_000 },
      { period: '2019-03-01', orders: 1, revenue: 222_000 },
    ]);
  });
  it('revenue theo tháng và năm', async () => {
    expect((await st('revenue?granularity=month&from=2019-02-01&to=2019-04-30')).body).toEqual([
      { period: '2019-02', orders: 1, revenue: 111_000 },
      { period: '2019-03', orders: 4, revenue: 3_722_000 },
      { period: '2019-04', orders: 1, revenue: 300_000 },
    ]);
    expect((await st('revenue?granularity=year&from=2019-01-01&to=2019-12-31')).body).toEqual([{ period: '2019', orders: 6, revenue: 4_133_000 }]);
    // khoảng cắt giữa tháng: chỉ tính đơn có ngày giao trong from..to
    expect((await st('revenue?granularity=month&from=2019-03-11&to=2019-03-31')).body).toEqual([{ period: '2019-03', orders: 2, revenue: 2_500_000 }]);
    // khoảng không có dữ liệu: điền 0
    const empty = await st('revenue?granularity=month&from=2018-01-01&to=2018-03-31');
    expect(empty.body.map((r: any) => r.period)).toEqual(['2018-01', '2018-02', '2018-03']);
    expect(empty.body.every((r: any) => r.orders === 0 && r.revenue === 0)).toBe(true);
  });
  it('revenue: granularity sai / khoảng > 366 ngày -> 400 đúng field', async () => {
    expect((await st('revenue?granularity=week')).status).toBe(400);
    expect(fieldsOf(await st('revenue?granularity=week'))).toContain('granularity');
    expectErr(await st('revenue?from=2019-01-01&to=2020-01-02'), 400, 'VALIDATION_ERROR');
    expect((await st('revenue?granularity=month&from=2015-01-01&to=2019-12-31')).status).toBe(400);
    expect((await st('revenue?granularity=year&from=2000-01-01&to=2019-12-31')).status).toBe(400);
  });
  it('tham số ngày: sai định dạng, from > to, > 366 ngày -> 400 đúng field; áp dụng cho mọi endpoint thống kê', async () => {
    for (const ep of ['overview', 'revenue', 'orders-by-status', 'top-products', 'top-customers']) {
      const bad = await st(`${ep}?from=2019-3-1&to=2019-03-10`);
      expectErr(bad, 400, 'VALIDATION_ERROR');
      expect(fieldsOf(bad), ep).toContain('from');
      expect(fieldsOf(await st(`${ep}?from=2019-03-01&to=10/03/2019`)), ep).toContain('to');
      expectErr(await st(`${ep}?from=2019-03-10&to=2019-03-01`), 400, 'VALIDATION_ERROR');
      expectErr(await st(`${ep}?from=2018-01-01&to=2019-12-31`), 400, 'VALIDATION_ERROR');
      expect((await st(`${ep}?from=2019-02-30&to=2019-03-10`)).status, `${ep} ngày không tồn tại`).toBe(400);
    }
    expect((await st('revenue?from=2019-01-01&to=2019-12-31')).status).toBe(200); // 365 ngày
  });
  it('mặc định khi bỏ trống: to = hôm nay (VN), from = to - 29 ngày', async () => {
    const res = await st('overview');
    expect(res.status).toBe(200);
    const vnToday = new Date(Date.now() + 7 * 3_600_000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    expect([fmt(vnToday), fmt(new Date(Date.now() + 7 * 3_600_000 - 1000))]).toContain(res.body.range.to);
    expect(fmt(new Date(Date.parse(res.body.range.to) - 29 * DAY))).toBe(res.body.range.from);
    const rev = await st('revenue');
    expect(rev.body).toHaveLength(30);
    expect(rev.body[29].period).toBe(res.body.range.to);
  });
  it('orders-by-status: đủ 6 khóa, tính theo createdAt và trạng thái hiện tại', async () => {
    const res = await st('orders-by-status?from=2019-03-01&to=2019-03-31');
    expect(res.body).toEqual({ pending: 1, confirmed: 0, preparing: 0, shipping: 1, delivered: 3, cancelled: 1 });
    expect((await st('orders-by-status?from=2018-01-01&to=2018-01-10')).body).toEqual({ pending: 0, confirmed: 0, preparing: 0, shipping: 0, delivered: 0, cancelled: 0 });
    // ranh giới: O8a/O8b tạo 2019-02-28 10:00Z (VN 28/02 17:00) -> thuộc 28/02
    expect((await st('orders-by-status?from=2019-02-28&to=2019-02-28')).body.delivered).toBe(2);
  });
  it('top-products: cộng đơn delivered theo ngày giao, nhóm theo productCode, thứ tự hòa theo quantity, revenue, productCode', async () => {
    const res = await st('top-products?from=2019-03-01&to=2019-03-31&limit=50');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const mine = res.body.filter((r: any) => [ctx.P1.code, ctx.P2.code, ctx.P3.code].includes(r.productCode));
    const tied = [ctx.P1.code, ctx.P3.code].sort();
    expect(mine.map((r: any) => r.productCode)).toEqual([ctx.P2.code, ...tied]);
    expect(mine[0]).toMatchObject({ productCode: ctx.P2.code, productName: ctx.P2.name, quantity: 5, revenue: 2_622_000, productId: ctx.P2.id, productSlug: ctx.P2.slug });
    expect(mine[1]).toMatchObject({ quantity: 3, revenue: 1_100_000 });
    expect(mine[2]).toMatchObject({ quantity: 3, revenue: 1_100_000 });
    // hủy/pending/shipping (qty 9 mỗi đơn) không được tính
    expect(mine.every((r: any) => r.quantity <= 5)).toBe(true);
    expect((await st('top-products?from=2019-03-01&to=2019-03-31&limit=1')).body).toHaveLength(1);
    expect((await st('top-products?from=2019-03-10&to=2019-03-10')).body.filter((r: any) => r.productCode === ctx.P3.code)).toEqual([]);
    expect(fieldsOf(await st('top-products?limit=51'))).toContain('limit');
    expect((await st('top-products?limit=0')).status).toBe(400);
  });
  it('top-customers: theo tổng tiền đơn giao thành công trong khoảng', async () => {
    const res = await st('top-customers?from=2019-03-01&to=2019-03-31&limit=50');
    const mine = res.body.filter((r: any) => [ctx.U1.id, ctx.U2.id].includes(r.userId));
    expect(mine).toEqual([
      { userId: ctx.U2.id, fullName: ctx.U2.name, phone: ctx.U2.phone, orders: 2, totalSpent: 2_222_000 },
      { userId: ctx.U1.id, fullName: ctx.U1.name, phone: ctx.U1.phone, orders: 2, totalSpent: 1_500_000 },
    ]);
    expect((await st('top-customers?from=2019-03-01&to=2019-03-31&limit=1')).body).toHaveLength(1);
    expect(fieldsOf(await st('top-customers?limit=51'))).toContain('limit');
    expect(JSON.stringify(res.body)).not.toMatch(/email|passwordHash/);
  });
  it('overview: inRange theo dữ liệu test, averageOrderValue làm tròn và 0 khi không có đơn', async () => {
    const res = await st('overview?from=2019-03-01&to=2019-03-31');
    expect(res.status).toBe(200);
    expect(res.body.range).toEqual({ from: '2019-03-01', to: '2019-03-31' });
    expect(res.body.inRange).toEqual({ orders: 4, revenue: 3_722_000, averageOrderValue: 930_500 });
    const one = await st('overview?from=2019-03-10&to=2019-03-11');
    expect(one.body.inRange).toEqual({ orders: 3, revenue: 3_500_000, averageOrderValue: 1_166_667 });
    const none = await st('overview?from=2018-01-01&to=2018-01-10');
    expect(none.body.inRange).toEqual({ orders: 0, revenue: 0, averageOrderValue: 0 });
  });
  it('overview: pendingOrders/today/thisMonth không phụ thuộc from/to; các tổng khớp truy vấn trực tiếp', async () => {
    const a = await st('overview?from=2019-03-01&to=2019-03-31');
    const b = await st('overview');
    for (const k of ['pendingOrders', 'today', 'thisMonth', 'totalCustomers', 'totalProducts', 'lowStockProducts']) expect(a.body[k], k).toEqual(b.body[k]);
    const one = async (sql: string, params: unknown[] = []) => Number((await db.query<mysql.RowDataPacket[]>(sql, params))[0][0].n);
    expect(b.body.pendingOrders).toBe(await one("SELECT COUNT(*) n FROM orders WHERE status='pending'"));
    expect(b.body.totalCustomers).toBe(await one("SELECT COUNT(*) n FROM users WHERE role='user'"));
    expect(b.body.totalProducts).toBe(await one('SELECT COUNT(*) n FROM products WHERE isActive=1'));
    expect(b.body.lowStockProducts).toBe(await one(
      'SELECT COUNT(DISTINCT p.id) n FROM products p JOIN product_variants v ON v.productId=p.id WHERE p.isActive=1 AND v.isActive=1 AND v.stock<=5',
    ));
    // today / thisMonth theo giờ VN
    const vnNow = new Date(Date.now() + 7 * 3_600_000);
    const dayStart = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()) - 7 * 3_600_000);
    const monthStart = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), 1) - 7 * 3_600_000);
    const sum = async (from: Date, to: Date) => {
      const [rows] = await db.query<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) n, COALESCE(SUM(o.total),0) r FROM orders o JOIN order_status_history h ON h.orderId=o.id AND h.status='delivered'
         WHERE h.createdAt >= ? AND h.createdAt < ?`, [from, to],
      );
      return { orders: Number(rows[0].n), revenue: Number(rows[0].r) };
    };
    const monthEnd = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth() + 1, 1) - 7 * 3_600_000);
    expect(b.body.today).toEqual(await sum(dayStart, new Date(dayStart.getTime() + DAY)));
    expect(b.body.thisMonth).toEqual(await sum(monthStart, monthEnd));
  });
  it('doanh thu hôm nay phản ánh đơn vừa giao (đúng một lần), đơn hủy/chưa giao không tính', async () => {
    const u = await mkUser();
    const before = (await st('overview')).body.today;
    await insertOrder(u.id, { status: 'delivered', total: 123_000, createdAt: new Date(), deliveredAt: new Date() });
    await insertOrder(u.id, { status: 'cancelled', total: 999_000, createdAt: new Date() });
    await insertOrder(u.id, { status: 'pending', total: 888_000, createdAt: new Date() });
    const after = (await st('overview')).body.today;
    expect(after.orders - before.orders).toBe(1);
    expect(after.revenue - before.revenue).toBe(123_000);
  });
  it('low-stock: threshold, limit, chỉ biến thể đang bán của sản phẩm đang bán, sắp stock tăng dần rồi productCode', async () => {
    const a = await mkProduct({ variants: [{ sku: `${CODE}-LS-A0`, size: '1', stock: 0 }, { sku: `${CODE}-LS-A3`, size: '2', stock: 3 }, { sku: `${CODE}-LS-A9`, size: '3', stock: 9 }, { sku: `${CODE}-LS-AH`, size: '4', stock: 0, isActive: false }] });
    const b = await mkProduct({ variants: [{ sku: `${CODE}-LS-B3`, size: '', stock: 3 }] });
    const hidden = await mkProduct({ variants: [{ sku: `${CODE}-LS-H1`, size: '', stock: 1 }] });
    await adm('patch', `/admin/products/${hidden.id}`, { isActive: false });
    const mineSkus = [`${CODE}-LS-A0`, `${CODE}-LS-A3`, `${CODE}-LS-A9`, `${CODE}-LS-AH`, `${CODE}-LS-B3`, `${CODE}-LS-H1`];
    const get = async (qs: string) => ((await st(`low-stock?${qs}`)).body as any[]).filter((r) => mineSkus.includes(r.sku));
    const def = await get('limit=100');
    expect(def.map((r) => r.sku)).toEqual([`${CODE}-LS-A0`, ...[`${CODE}-LS-A3`, `${CODE}-LS-B3`].sort((x, y) => (x === `${CODE}-LS-A3` ? a.code : b.code).localeCompare(y === `${CODE}-LS-A3` ? a.code : b.code))]);
    expect(def[0]).toEqual({ productId: a.id, productCode: a.code, productName: a.name, variantId: a.variants[0].id, sku: `${CODE}-LS-A0`, size: '1', stock: 0 });
    expect((await get('threshold=0&limit=100')).map((r) => r.sku)).toEqual([`${CODE}-LS-A0`]);
    expect((await get('threshold=9&limit=100')).map((r) => r.sku)).toContain(`${CODE}-LS-A9`);
    const all = (await st('low-stock?limit=100')).body as any[];
    expect(all.map((r) => r.stock)).toEqual([...all.map((r) => r.stock)].sort((x, y) => x - y));
    expect((await st('low-stock?limit=1')).body).toHaveLength(1);
    expect(fieldsOf(await st('low-stock?limit=101'))).toContain('limit');
    expect(fieldsOf(await st('low-stock?threshold=1001'))).toContain('threshold');
    expect((await st('low-stock?threshold=-1')).status).toBe(400);
    expect((await st('low-stock?threshold=abc')).status).toBe(400);
  });
});
