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
let seq = 0;
const n = () => ++seq;

let app: INestApplication;
let db: mysql.Connection;
let adminToken = '';
let shipId = 0;
let cat: { id: number };

const noStorage = { isConfigured: () => false, upload: async () => { throw new Error('off'); }, delete: async () => undefined };
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
const call = (method: Method, path: string, token?: string, body?: object) => {
  const r = request(app.getHttpServer())[method](`/api${path}`);
  if (token) r.set('Authorization', `Bearer ${token}`);
  return body ? r.send(body) : r;
};
const adm = (method: Method, path: string, body?: object) => call(method, path, adminToken, body);

interface TU { id: number; token: string; phone: string; email: string }
async function mkUser(role: 'admin' | 'user' = 'user', fullName = 'Nguyen Van Test'): Promise<TU> {
  const email = `e2e-rev-${runId}-${n()}@e2e.test`;
  const phone = '0995' + String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
  const hash = await bcrypt.hash(PASSWORD, 4);
  const [r] = await db.query<mysql.ResultSetHeader>(
    'INSERT INTO users (fullName,email,phone,passwordHash,role,status) VALUES (?,?,?,?,?,?)',
    [fullName, email, phone, hash, role, 'active'],
  );
  const res = await request(app.getHttpServer()).post('/api/auth/login').send({ phone, password: PASSWORD });
  expect(res.status).toBe(200);
  return { id: r.insertId, token: res.body.accessToken, phone, email };
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
async function mkProduct(categoryId = cat.id, over: Record<string, unknown> = {}) {
  const i = n();
  const res = await adm('post', '/admin/products', {
    code: `${CODE}-${i}`, name: `${NAME} P${i}`, categoryId, price: 1_000_000,
    variants: [{ sku: `${CODE}-${i}-A`, size: '10', stock: 10 }, { sku: `${CODE}-${i}-B`, size: '11', stock: 10 }],
    ...over,
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as any;
}
/** Chèn thẳng một đơn (mọi trạng thái) chứa một biến thể; trả id dòng đơn. */
async function insertOrder(userId: number, product: any, variantIdx: number, status: string, createdAt?: Date) {
  const code = `TMP-E2E-RV-${runId}-${n()}`;
  const [o] = await db.query<mysql.ResultSetHeader>(
    `INSERT INTO orders (code,userId,receiverName,receiverPhone,provinceName,wardName,addressDetail,shippingMethodId,shippingMethodName,subtotal,shippingFee,total,paymentMethod,status,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [code, userId, 'E2E', '0911111111', 'P', 'W', 'A', shipId, 'x', 1000, 0, 1000, 'cod', status, createdAt ?? new Date()],
  );
  const v = product.variants[variantIdx];
  const [it] = await db.query<mysql.ResultSetHeader>(
    'INSERT INTO order_items (orderId,variantId,productName,productCode,size,unitPrice,quantity,lineTotal) VALUES (?,?,?,?,?,?,?,?)',
    [o.insertId, v.id, product.name, product.code, v.size, 1000, 1, 1000],
  );
  await db.query('INSERT INTO order_status_history (orderId,status,note) VALUES (?,?,?)', [o.insertId, status, 'test']);
  return it.insertId;
}
const buyer = async (product: any, fullName?: string, variantIdx = 0) => {
  const u = await mkUser('user', fullName);
  await insertOrder(u.id, product, variantIdx, 'delivered');
  return u;
};
const post = (u: { token: string }, p: any, body: object) => call('post', `/products/${p.slug}/reviews`, u.token, body);

/** avgRating/reviewCount của sản phẩm phải khớp với tính lại từ đánh giá hiển thị. */
async function expectAggregate(p: any) {
  const [[calc]] = await db.query<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) c, COALESCE(ROUND(AVG(rating),2),0) a FROM reviews WHERE productId=? AND isHidden=0', [p.id],
  );
  const [[row]] = await db.query<mysql.RowDataPacket[]>('SELECT avgRating a, reviewCount c FROM products WHERE id=?', [p.id]);
  expect(Number(row.c), 'reviewCount').toBe(Number(calc.c));
  expect(Number(row.a), 'avgRating').toBeCloseTo(Number(calc.a), 2);
  const detail = await call('get', `/products/${p.slug}`);
  expect(detail.body.reviewCount).toBe(Number(calc.c));
  expect(detail.body.avgRating).toBeCloseTo(Number(calc.a), 2);
  const list = await call('get', `/products?q=${encodeURIComponent(p.code)}`);
  const item = list.body.items.find((i: any) => i.id === p.id);
  expect(item.reviewCount).toBe(Number(calc.c));
  expect(item.avgRating).toBeCloseTo(Number(calc.a), 2);
  return { count: Number(calc.c), avg: Number(calc.a) };
}

async function cleanup() {
  const sub = "(SELECT id FROM users WHERE email LIKE '%@e2e.test')";
  await db.query(`DELETE FROM reviews WHERE userId IN ${sub}`);
  await db.query("DELETE FROM reviews WHERE productId IN (SELECT id FROM products WHERE code LIKE 'TMP-E2E-%')");
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
  await db.query('DELETE FROM users WHERE email LIKE \'%@e2e.test\'');
}

beforeAll(async () => {
  db = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { ca: readFileSync(process.env.DB_SSL_CA as string, 'utf8') } : undefined,
    charset: 'utf8mb4',
  });
  await cleanup();
  const m = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ImageStorage).useValue(noStorage).overrideProvider(MailService).useValue({ sendOtpMail: () => undefined, sendOrderPaidMail: () => undefined, sendOrderDeliveredMail: () => undefined }).compile();
  app = m.createNestApplication();
  configureApp(app);
  await app.init();
  adminToken = (await mkUser('admin', 'E2E Admin')).token;
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
describe('Quyền đánh giá', () => {
  it('không token -> 401 cho các endpoint cần đăng nhập', async () => {
    const p = await mkProduct();
    expect((await call('post', `/products/${p.slug}/reviews`, undefined, { rating: 5 })).status).toBe(401);
    expect((await call('get', `/products/${p.slug}/my-review`)).status).toBe(401);
    expect((await call('get', '/reviews/me')).status).toBe(401);
    expect((await call('patch', '/reviews/1', undefined, { rating: 5 })).status).toBe(401);
    expect((await call('delete', '/reviews/1')).status).toBe(401);
  });
  it('chưa mua -> 403 REVIEW_NOT_ALLOWED; my-review báo NOT_PURCHASED', async () => {
    const p = await mkProduct();
    const u = await mkUser();
    expectErr(await post(u, p, { rating: 5 }), 403, 'REVIEW_NOT_ALLOWED');
    const my = await call('get', `/products/${p.slug}/my-review`, u.token);
    expect(my.body).toEqual({ eligible: false, reason: 'NOT_PURCHASED', review: null });
  });
  it.each(['pending', 'confirmed', 'preparing', 'shipping', 'cancelled'])('đơn %s không đủ điều kiện -> 403', async (status) => {
    const p = await mkProduct();
    const u = await mkUser();
    await insertOrder(u.id, p, 0, status);
    expectErr(await post(u, p, { rating: 4 }), 403, 'REVIEW_NOT_ALLOWED');
    expect((await call('get', `/products/${p.slug}/my-review`, u.token)).body.reason).toBe('NOT_PURCHASED');
  });
  it('đơn delivered của sản phẩm khác không tính', async () => {
    const p = await mkProduct();
    const other = await mkProduct();
    const u = await mkUser();
    await insertOrder(u.id, other, 0, 'delivered');
    expectErr(await post(u, p, { rating: 4 }), 403, 'REVIEW_NOT_ALLOWED');
  });
  it('có đơn delivered (bất kỳ size) -> 201; orderItemId là dòng của đơn delivered gần nhất', async () => {
    const p = await mkProduct();
    const u = await mkUser();
    const older = await insertOrder(u.id, p, 0, 'delivered', new Date(Date.now() - 5 * 86_400_000));
    const newest = await insertOrder(u.id, p, 1, 'delivered', new Date(Date.now() - 1 * 86_400_000));
    await insertOrder(u.id, p, 0, 'pending'); // mới hơn nhưng chưa giao: không tính
    expect((await call('get', `/products/${p.slug}/my-review`, u.token)).body).toEqual({ eligible: true, reason: null, review: null });
    const res = await post(u, p, { rating: 5, comment: 'Rất đẹp' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body).toMatchObject({ rating: 5, comment: 'Rất đẹp', isHidden: false });
    expect(typeof res.body.id).toBe('number');
    expect(typeof res.body.createdAt).toBe('string');
    expect(typeof res.body.updatedAt).toBe('string');
    const [[row]] = await db.query<mysql.RowDataPacket[]>('SELECT orderItemId, userId, productId FROM reviews WHERE id=?', [res.body.id]);
    expect(row.orderItemId).toBe(newest);
    expect(row.orderItemId).not.toBe(older);
    expect(row).toMatchObject({ userId: u.id, productId: p.id });
    const my = await call('get', `/products/${p.slug}/my-review`, u.token);
    expect(my.body.eligible).toBe(false);
    expect(my.body.reason).toBe('ALREADY_REVIEWED');
    expect(my.body.review).toMatchObject({ id: res.body.id, rating: 5, comment: 'Rất đẹp', isHidden: false });
    expect(Object.keys(my.body.review).sort()).toEqual(['comment', 'createdAt', 'id', 'isHidden', 'rating', 'updatedAt']);
  });
  it('sản phẩm không tồn tại / ẩn / danh mục ẩn -> 404', async () => {
    const u = await mkUser();
    const hiddenCat = await mkCategory();
    const hidden = await mkProduct();
    const inHiddenCat = await mkProduct(hiddenCat.id);
    await insertOrder(u.id, hidden, 0, 'delivered');
    await insertOrder(u.id, inHiddenCat, 0, 'delivered');
    await adm('patch', `/admin/products/${hidden.id}`, { isActive: false });
    await adm('patch', `/admin/categories/${hiddenCat.id}`, { isActive: false });
    for (const [label, slug] of [['khong-ton-tai', 'khong-ton-tai-xyz'], ['san-pham-an', hidden.slug], ['danh-muc-an', inHiddenCat.slug]]) {
      const created = await call('post', `/products/${slug}/reviews`, u.token, { rating: 5 });
      expect(created.status, label + ' ' + JSON.stringify(created.body)).toBe(404);
      expectErr(await call('post', `/products/${slug}/reviews`, u.token, { rating: 5 }), 404, 'NOT_FOUND');
      expectErr(await call('get', `/products/${slug}/my-review`, u.token), 404, 'NOT_FOUND');
      expectErr(await call('get', `/products/${slug}/reviews`), 404, 'NOT_FOUND');
    }
  });
});

// ===================================================================
describe('Validate', () => {
  it.each([
    ['rating 0', { rating: 0 }, 'rating'],
    ['rating 6', { rating: 6 }, 'rating'],
    ['rating âm', { rating: -1 }, 'rating'],
    ['rating không nguyên', { rating: 3.5 }, 'rating'],
    ['rating là chuỗi chữ', { rating: 'abc' }, 'rating'],
    ['thiếu rating', { comment: 'x' }, 'rating'],
    ['comment > 1000 ký tự', { rating: 5, comment: 'a'.repeat(1001) }, 'comment'],
  ])('%s -> 400 VALIDATION_ERROR', async (_n, body, field) => {
    const p = await mkProduct();
    const u = await buyer(p);
    const res = await post(u, p, body);
    expectErr(res, 400, 'VALIDATION_ERROR');
    expect(fieldsOf(res)).toContain(field);
    const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM reviews WHERE userId=?', [u.id]);
    expect(rows).toHaveLength(0);
  });
  it('comment đúng 1000 ký tự được; comment khoảng trắng lưu null; cắt khoảng trắng đầu/cuối', async () => {
    const p = await mkProduct();
    const u1 = await buyer(p);
    const u2 = await buyer(p);
    const u3 = await buyer(p);
    expect((await post(u1, p, { rating: 4, comment: 'a'.repeat(1000) })).status).toBe(201);
    const blank = await post(u2, p, { rating: 4, comment: '    ' });
    expect(blank.status).toBe(201);
    expect(blank.body.comment).toBeNull();
    const trimmed = await post(u3, p, { rating: 4, comment: '   Đẹp   ' });
    expect(trimmed.body.comment).toBe('Đẹp');
    const [[row]] = await db.query<mysql.RowDataPacket[]>('SELECT comment FROM reviews WHERE id=?', [blank.body.id]);
    expect(row.comment).toBeNull();
  });
  it('comment toàn khoảng trắng nhưng dài > 1000 sau khi trim rỗng vẫn hợp lệ hoặc báo lỗi rõ ràng (không 5xx)', async () => {
    const p = await mkProduct();
    const u = await buyer(p);
    const res = await post(u, p, { rating: 5, comment: ' '.repeat(1500) });
    expect(res.status).toBeLessThan(500);
  });
  it('trường lạ (userId, isHidden, orderItemId, productId) bị bỏ qua', async () => {
    const p = await mkProduct();
    const other = await mkProduct();
    const u = await buyer(p);
    const res = await post(u, p, { rating: 5, userId: 1, isHidden: true, orderItemId: 1, productId: other.id, createdAt: '2000-01-01' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.isHidden).toBe(false);
    const [[row]] = await db.query<mysql.RowDataPacket[]>('SELECT userId, productId, isHidden, orderItemId, createdAt FROM reviews WHERE id=?', [res.body.id]);
    expect(row).toMatchObject({ userId: u.id, productId: p.id, isHidden: 0 });
    expect(row.orderItemId).not.toBe(1);
    expect(new Date(row.createdAt).getFullYear()).toBeGreaterThan(2000);
  });
});

// ===================================================================
describe('Trùng đánh giá', () => {
  it('đánh giá lần hai -> 409 REVIEW_ALREADY_EXISTS; xóa rồi viết lại được', async () => {
    const p = await mkProduct();
    const u = await buyer(p);
    const first = await post(u, p, { rating: 5 });
    expect(first.status).toBe(201);
    expectErr(await post(u, p, { rating: 1 }), 409, 'REVIEW_ALREADY_EXISTS');
    expect((await call('delete', `/reviews/${first.body.id}`, u.token)).status).toBe(204);
    const again = await post(u, p, { rating: 2, comment: 'viết lại' });
    expect(again.status, JSON.stringify(again.body)).toBe(201);
    expect(again.body.id).not.toBe(first.body.id);
    expect((await call('get', `/products/${p.slug}/my-review`, u.token)).body.review.rating).toBe(2);
  });
  it('10 request song song cùng một người -> đúng 1 thành công', async () => {
    const p = await mkProduct();
    const u = await buyer(p);
    const rs = await Promise.all(Array.from({ length: 10 }, (_, i) => post(u, p, { rating: (i % 5) + 1 })));
    expect(rs.filter((r) => r.status >= 500)).toHaveLength(0);
    expect(rs.filter((r) => r.status === 201)).toHaveLength(1);
    expect(rs.filter((r) => r.status === 409 && r.body.code === 'REVIEW_ALREADY_EXISTS')).toHaveLength(9);
    const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM reviews WHERE userId=? AND productId=?', [u.id, p.id]);
    expect(rows).toHaveLength(1);
    expect((await expectAggregate(p)).count).toBe(1);
  });
});

// ===================================================================
describe('Tổng hợp avgRating / reviewCount', () => {
  it('khớp sau mỗi thao tác: tạo, sửa, ẩn, hiện, xóa; không có đánh giá -> 0/0', async () => {
    const p = await mkProduct();
    expect(await expectAggregate(p)).toEqual({ count: 0, avg: 0 });
    const [u1, u2, u3] = await Promise.all([buyer(p), buyer(p), buyer(p)]);
    const r1 = (await post(u1, p, { rating: 5 })).body;
    expect(await expectAggregate(p)).toEqual({ count: 1, avg: 5 });
    const r2 = (await post(u2, p, { rating: 4 })).body;
    expect(await expectAggregate(p)).toEqual({ count: 2, avg: 4.5 });
    const r3 = (await post(u3, p, { rating: 4 })).body;
    expect(await expectAggregate(p)).toEqual({ count: 3, avg: 4.33 });
    // sửa điểm
    expect((await call('patch', `/reviews/${r3.id}`, u3.token, { rating: 1 })).status).toBe(200);
    expect(await expectAggregate(p)).toEqual({ count: 3, avg: 3.33 });
    // ẩn: không tính
    expect((await adm('patch', `/admin/reviews/${r1.id}/visibility`, { isHidden: true })).status).toBe(200);
    expect(await expectAggregate(p)).toEqual({ count: 2, avg: 2.5 });
    // hiện lại
    expect((await adm('patch', `/admin/reviews/${r1.id}/visibility`, { isHidden: false })).status).toBe(200);
    expect(await expectAggregate(p)).toEqual({ count: 3, avg: 3.33 });
    // xóa
    expect((await call('delete', `/reviews/${r2.id}`, u2.token)).status).toBe(204);
    expect(await expectAggregate(p)).toEqual({ count: 2, avg: 3 });
    // ẩn hết -> 0/0
    await adm('patch', `/admin/reviews/${r1.id}/visibility`, { isHidden: true });
    await adm('patch', `/admin/reviews/${r3.id}/visibility`, { isHidden: true });
    expect(await expectAggregate(p)).toEqual({ count: 0, avg: 0 });
    // xóa đánh giá đang ẩn không đổi số liệu
    expect((await call('delete', `/reviews/${r3.id}`, u3.token)).status).toBe(204);
    expect(await expectAggregate(p)).toEqual({ count: 0, avg: 0 });
  });

  it('>= 8 người đánh giá song song cùng một sản phẩm -> số liệu cuối khớp', async () => {
    const p = await mkProduct();
    const users = await Promise.all(Array.from({ length: 9 }, () => buyer(p)));
    const ratings = [5, 4, 3, 2, 1, 5, 5, 4, 3];
    const rs = await Promise.all(users.map((u, i) => post(u, p, { rating: ratings[i] })));
    expect(rs.filter((r) => r.status >= 500).map((r) => r.body)).toEqual([]);
    expect(rs.every((r) => r.status === 201)).toBe(true);
    const agg = await expectAggregate(p);
    expect(agg.count).toBe(9);
    expect(agg.avg).toBeCloseTo(Math.round((ratings.reduce((a, b) => a + b, 0) / 9) * 100) / 100, 2);
  }, 60_000);

  it('admin ẩn/hiện và chủ sửa điểm chạy song song -> không 5xx, số liệu khớp', async () => {
    const p = await mkProduct();
    const users = await Promise.all(Array.from({ length: 4 }, () => buyer(p)));
    const reviews = [];
    for (const u of users) reviews.push((await post(u, p, { rating: 3 })).body);
    for (let round = 0; round < 3; round++) {
      const ops: Promise<request.Response>[] = [];
      reviews.forEach((r, i) => {
        ops.push(adm('patch', `/admin/reviews/${r.id}/visibility`, { isHidden: round % 2 === 0 }) as unknown as Promise<request.Response>);
        ops.push(call('patch', `/reviews/${r.id}`, users[i].token, { rating: ((i + round) % 5) + 1 }) as unknown as Promise<request.Response>);
      });
      const rs = await Promise.all(ops);
      expect(rs.filter((r) => r.status >= 500).map((r) => r.body)).toEqual([]);
      // PATCH có thể 403 REVIEW_HIDDEN nếu đã bị ẩn; mọi mã khác ngoài 200/403 là bất thường
      expect(rs.every((r) => [200, 403].includes(r.status))).toBe(true);
      await expectAggregate(p);
    }
  }, 90_000);

  it('sort=rating ở GET /products phản ánh điểm mới', async () => {
    const a = await mkProduct();
    const b = await mkProduct();
    const c = await mkProduct();
    const ua = await buyer(a);
    const ub = await buyer(b);
    await post(ua, a, { rating: 5 });
    const rb = (await post(ub, b, { rating: 3 })).body;
    const order = async () =>
      ((await call('get', `/products?q=${encodeURIComponent(CODE)}&sort=rating&pageSize=48`)).body.items as any[])
        .map((i) => i.id).filter((id) => [a.id, b.id, c.id].includes(id));
    expect(await order()).toEqual([a.id, b.id, c.id]);
    await call('patch', `/reviews/${rb.id}`, ub.token, { rating: 5 });
    await call('patch', `/reviews/${(await db.query<mysql.RowDataPacket[]>('SELECT id FROM reviews WHERE userId=?', [ua.id]))[0][0].id}`, ua.token, { rating: 1 });
    expect(await order()).toEqual([b.id, a.id, c.id]);
  });
});

// ===================================================================
describe('GET /products/:slug/reviews (công khai)', () => {
  it('không token và token sai đều 200 với isMine=false; token đúng thì isMine đúng', async () => {
    const p = await mkProduct();
    const u1 = await buyer(p);
    const u2 = await buyer(p);
    const r1 = (await post(u1, p, { rating: 5, comment: 'A' })).body;
    await post(u2, p, { rating: 4, comment: 'B' });
    const anon = await call('get', `/products/${p.slug}/reviews`);
    expect(anon.status).toBe(200);
    expect(anon.body.items.every((i: any) => i.isMine === false)).toBe(true);
    const bad = await call('get', `/products/${p.slug}/reviews`, 'abc.def.ghi');
    expect(bad.status).toBe(200);
    expect(bad.body.items.every((i: any) => i.isMine === false)).toBe(true);
    const mine = await call('get', `/products/${p.slug}/reviews`, u1.token);
    expect(mine.body.items.filter((i: any) => i.isMine).map((i: any) => i.id)).toEqual([r1.id]);
    expect(Object.keys(mine.body.items[0]).sort()).toEqual(['comment', 'createdAt', 'id', 'isMine', 'rating', 'reviewerName', 'updatedAt']);
  });
  it('summary tính trên mọi đánh giá hiển thị kể cả khi lọc/phân trang; lọc sao; phân trang; mới nhất trước', async () => {
    const p = await mkProduct();
    const ratings = [5, 5, 4, 3, 1, 5, 2];
    const users = await Promise.all(ratings.map(() => buyer(p)));
    const ids: number[] = [];
    for (let i = 0; i < users.length; i++) {
      const r = (await post(users[i], p, { rating: ratings[i], comment: `c${i}` })).body;
      ids.push(r.id);
      await db.query('UPDATE reviews SET createdAt = ? WHERE id=?', [new Date(Date.now() - (ratings.length - i) * 60_000), r.id]);
    }
    const hidden = (await post(await buyer(p), p, { rating: 1 })).body;
    await adm('patch', `/admin/reviews/${hidden.id}/visibility`, { isHidden: true });

    const all = await call('get', `/products/${p.slug}/reviews`);
    const avg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100;
    expect(all.body.summary).toEqual({ avgRating: avg, reviewCount: 7, distribution: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 3 } });
    expect(all.body).toMatchObject({ page: 1, pageSize: 10, total: 7, totalPages: 1 });
    expect(all.body.items.map((i: any) => i.id)).toEqual([...ids].reverse()); // mới nhất trước
    expect(all.body.items.map((i: any) => i.id)).not.toContain(hidden.id);

    const five = await call('get', `/products/${p.slug}/reviews?rating=5`);
    expect(five.body.total).toBe(3);
    expect(five.body.items.every((i: any) => i.rating === 5)).toBe(true);
    expect(five.body.summary).toEqual(all.body.summary); // không phụ thuộc bộ lọc

    const paged = await call('get', `/products/${p.slug}/reviews?pageSize=3&page=2`);
    expect(paged.body).toMatchObject({ page: 2, pageSize: 3, total: 7, totalPages: 3 });
    expect(paged.body.items.map((i: any) => i.id)).toEqual([...ids].reverse().slice(3, 6));
    expect(paged.body.summary).toEqual(all.body.summary);
    expect((await call('get', `/products/${p.slug}/reviews?pageSize=500`)).body.pageSize).toBe(50);
    expect((await call('get', `/products/${p.slug}/reviews?rating=9`)).status).toBe(400);
    expect((await call('get', `/products/${p.slug}/reviews?page=0`)).status).toBe(400);
  });
  it('thứ tự ổn định khi createdAt trùng (id giảm dần)', async () => {
    const p = await mkProduct();
    const users = await Promise.all(Array.from({ length: 4 }, () => buyer(p)));
    const ids: number[] = [];
    for (const u of users) ids.push((await post(u, p, { rating: 4 })).body.id);
    await db.query('UPDATE reviews SET createdAt = ? WHERE productId=?', [new Date('2026-01-01T00:00:00Z'), p.id]);
    const res = await call('get', `/products/${p.slug}/reviews`);
    expect(res.body.items.map((i: any) => i.id)).toEqual([...ids].sort((a, b) => b - a));
    const p1 = await call('get', `/products/${p.slug}/reviews?pageSize=2&page=1`);
    const p2 = await call('get', `/products/${p.slug}/reviews?pageSize=2&page=2`);
    expect([...p1.body.items, ...p2.body.items].map((i: any) => i.id)).toEqual(res.body.items.map((i: any) => i.id));
  });
  it('che tên: "Trần Tiến Dũng" -> "Trần T. D.", "Dũng" -> "D***"; không lộ email/SĐT/userId', async () => {
    const p = await mkProduct();
    const u1 = await buyer(p, 'Trần Tiến Dũng');
    const u2 = await buyer(p, 'Dũng');
    const u3 = await buyer(p, 'Nguyễn Văn');
    await post(u1, p, { rating: 5 });
    await post(u2, p, { rating: 5 });
    await post(u3, p, { rating: 5 });
    const res = await call('get', `/products/${p.slug}/reviews`, u1.token);
    const names = res.body.items.map((i: any) => i.reviewerName).sort();
    expect(names).toEqual(['D***', 'Nguyễn V.', 'Trần T. D.'].sort());
    const text = JSON.stringify(res.body);
    for (const u of [u1, u2, u3]) {
      expect(text).not.toContain(u.email);
      expect(text).not.toContain(u.phone);
    }
    expect(text).not.toMatch(/userId|email|phone|"role"/i);
  });
  it('sản phẩm chưa có đánh giá: summary 0 và distribution đủ 5 mức', async () => {
    const p = await mkProduct();
    const res = await call('get', `/products/${p.slug}/reviews`);
    expect(res.body.summary).toEqual({ avgRating: 0, reviewCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
    expect(res.body).toMatchObject({ items: [], total: 0, totalPages: 0 });
  });
});

// ===================================================================
describe('Sửa / xóa của chủ', () => {
  it('PATCH điểm / nhận xét; ít nhất một trường; trường lạ bỏ qua', async () => {
    const p = await mkProduct();
    const u = await buyer(p);
    const r = (await post(u, p, { rating: 3, comment: 'cũ' })).body;
    const a = await call('patch', `/reviews/${r.id}`, u.token, { rating: 5 });
    expect(a.status).toBe(200);
    expect(a.body).toMatchObject({ id: r.id, rating: 5, comment: 'cũ', isHidden: false });
    const b = await call('patch', `/reviews/${r.id}`, u.token, { comment: '  mới  ' });
    expect(b.body).toMatchObject({ rating: 5, comment: 'mới' });
    const c = await call('patch', `/reviews/${r.id}`, u.token, { rating: 2, comment: 'cả hai', isHidden: true, userId: 1 });
    expect(c.body).toMatchObject({ rating: 2, comment: 'cả hai', isHidden: false });
    expectErr(await call('patch', `/reviews/${r.id}`, u.token, {}), 400, 'VALIDATION_ERROR');
    expectErr(await call('patch', `/reviews/${r.id}`, u.token, { rating: 9 }), 400, 'VALIDATION_ERROR');
    expectErr(await call('patch', `/reviews/${r.id}`, u.token, { comment: 'x'.repeat(1001) }), 400, 'VALIDATION_ERROR');
    expectErr(await call('patch', `/reviews/${r.id}`, u.token, { rating: 3.5 }), 400, 'VALIDATION_ERROR');
    expectErr(await call('patch', '/reviews/999999999', u.token, { rating: 3 }), 404, 'NOT_FOUND');
    await expectAggregate(p);
  });
  it('đánh giá của người khác -> 404 cho PATCH/DELETE', async () => {
    const p = await mkProduct();
    const owner = await buyer(p);
    const other = await buyer(p);
    const r = (await post(owner, p, { rating: 4 })).body;
    expectErr(await call('patch', `/reviews/${r.id}`, other.token, { rating: 1 }), 404, 'NOT_FOUND');
    expectErr(await call('delete', `/reviews/${r.id}`, other.token), 404, 'NOT_FOUND');
    expect((await call('get', `/products/${p.slug}/my-review`, owner.token)).body.review.rating).toBe(4);
    expectErr(await call('delete', '/reviews/999999999', owner.token), 404, 'NOT_FOUND');
  });
  it('đang bị ẩn: PATCH -> 403 REVIEW_HIDDEN nhưng DELETE được; hiện lại thì sửa được', async () => {
    const p = await mkProduct();
    const u = await buyer(p);
    const r = (await post(u, p, { rating: 4 })).body;
    await adm('patch', `/admin/reviews/${r.id}/visibility`, { isHidden: true });
    expectErr(await call('patch', `/reviews/${r.id}`, u.token, { rating: 1 }), 403, 'REVIEW_HIDDEN');
    expect((await call('get', `/products/${p.slug}/my-review`, u.token)).body.review.isHidden).toBe(true);
    await adm('patch', `/admin/reviews/${r.id}/visibility`, { isHidden: false });
    expect((await call('patch', `/reviews/${r.id}`, u.token, { rating: 1 })).status).toBe(200);
    await adm('patch', `/admin/reviews/${r.id}/visibility`, { isHidden: true });
    expect((await call('delete', `/reviews/${r.id}`, u.token)).status).toBe(204);
    await expectAggregate(p);
  });
  it('GET /reviews/me: phân trang, productName/productSlug/isHidden, mới nhất trước, chỉ của mình', async () => {
    const u = await mkUser();
    const other = await mkUser();
    const ps = await Promise.all([mkProduct(), mkProduct(), mkProduct()]);
    const ids: number[] = [];
    for (let i = 0; i < ps.length; i++) {
      await insertOrder(u.id, ps[i], 0, 'delivered');
      const r = (await post(u, ps[i], { rating: i + 1, comment: `n${i}` })).body;
      ids.push(r.id);
      await db.query('UPDATE reviews SET createdAt = ? WHERE id=?', [new Date(Date.now() - (ps.length - i) * 60_000), r.id]);
    }
    await insertOrder(other.id, ps[0], 0, 'delivered');
    await post(other, ps[0], { rating: 5 });
    await adm('patch', `/admin/reviews/${ids[2]}/visibility`, { isHidden: true });
    const res = await call('get', '/reviews/me', u.token);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, pageSize: 10, total: 3, totalPages: 1 });
    expect(res.body.items.map((i: any) => i.id)).toEqual([...ids].reverse());
    expect(res.body.items[0]).toMatchObject({ productId: ps[2].id, productName: ps[2].name, productSlug: ps[2].slug, rating: 3, comment: 'n2', isHidden: true });
    expect(res.body.items[2].isHidden).toBe(false);
    for (const k of ['id', 'productId', 'productName', 'productSlug', 'rating', 'comment', 'isHidden', 'createdAt', 'updatedAt']) expect(res.body.items[0]).toHaveProperty(k);
    const pg = await call('get', '/reviews/me?pageSize=2&page=2', u.token);
    expect(pg.body).toMatchObject({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
    expect(pg.body.items).toHaveLength(1);
    expect((await call('get', '/reviews/me?pageSize=500', u.token)).body.pageSize).toBe(50);
  });
});

// ===================================================================
describe('Admin: quản lý đánh giá', () => {
  it('401 không token, 403 role user', async () => {
    const user = await mkUser();
    for (const [m, p] of [['get', '/admin/reviews'], ['patch', '/admin/reviews/1/visibility']] as const) {
      expect((await call(m, p)).status).toBe(401);
      expect((await call(m, p, user.token, { isHidden: true })).status).toBe(403);
    }
  });
  it('list: lọc q (nhận xét, tên/mã sản phẩm, tên/SĐT người đánh giá), rating, hidden, productId, phân trang; trả đủ trường', async () => {
    const p1 = await mkProduct();
    const p2 = await mkProduct();
    const uA = await buyer(p1, `Lê Văn ${runId}A`);
    const uB = await buyer(p1, `Phạm Thị ${runId}B`);
    const uC = await buyer(p2, `Hồ Minh ${runId}C`);
    const rA = (await post(uA, p1, { rating: 5, comment: `Nhận xét Đặc-Biệt ${runId}` })).body;
    const rB = (await post(uB, p1, { rating: 2, comment: 'tạm được' })).body;
    const rC = (await post(uC, p2, { rating: 4, comment: 'ổn' })).body;
    await adm('patch', `/admin/reviews/${rB.id}/visibility`, { isHidden: true });
    const q = async (qs: string) => (await adm('get', `/admin/reviews?pageSize=100&${qs}`)).body;
    const idsOf = (b: any) => b.items.map((i: any) => i.id).sort((a: number, b2: number) => a - b2);
    const sorted = (...x: number[]) => x.sort((a, b) => a - b);

    expect(idsOf(await q(`q=${encodeURIComponent(`đặc-biệt ${runId}`)}`))).toEqual([rA.id]); // nhận xét, không phân biệt hoa thường
    expect(idsOf(await q(`q=${encodeURIComponent(p1.code)}`))).toEqual(sorted(rA.id, rB.id)); // mã sản phẩm
    expect(idsOf(await q(`q=${encodeURIComponent(p2.name)}`))).toEqual([rC.id]); // tên sản phẩm
    expect(idsOf(await q(`q=${encodeURIComponent(`phạm thị ${runId}b`)}`))).toEqual([rB.id]); // tên người đánh giá
    expect(idsOf(await q(`q=${uC.phone}`))).toEqual([rC.id]); // SĐT
    expect(idsOf(await q(`productId=${p1.id}`))).toEqual(sorted(rA.id, rB.id));
    expect(idsOf(await q(`productId=${p1.id}&rating=5`))).toEqual([rA.id]);
    expect(idsOf(await q(`productId=${p1.id}&hidden=true`))).toEqual([rB.id]);
    expect(idsOf(await q(`productId=${p1.id}&hidden=false`))).toEqual([rA.id]);
    const pg = await adm('get', `/admin/reviews?productId=${p1.id}&pageSize=1&page=2`);
    expect(pg.body).toMatchObject({ page: 2, pageSize: 1, total: 2, totalPages: 2 });
    expect(pg.body.items).toHaveLength(1);
    const item = (await q(`productId=${p2.id}`)).items[0];
    expect(item).toMatchObject({
      id: rC.id, productId: p2.id, productName: p2.name, productCode: p2.code, productSlug: p2.slug, userId: uC.id,
      reviewerName: `Hồ Minh ${runId}C`, reviewerPhone: uC.phone, rating: 4, comment: 'ổn', isHidden: false,
    });
    expect(typeof item.createdAt).toBe('string');
    expect(typeof item.updatedAt).toBe('string');
    expect((await adm('get', '/admin/reviews')).body.pageSize).toBe(20);
    expect((await adm('get', '/admin/reviews?pageSize=500')).body.pageSize).toBe(100);
    expect((await adm('get', '/admin/reviews?rating=9')).status).toBe(400);
    expect((await adm('get', '/admin/reviews?hidden=maybe')).status).toBe(400);
  });
  it('visibility: đổi cờ, lặp lại cùng giá trị vẫn 200, cập nhật tổng hợp; id không tồn tại 404; body sai 400', async () => {
    const p = await mkProduct();
    const u = await buyer(p);
    const r = (await post(u, p, { rating: 4 })).body;
    const hide = await adm('patch', `/admin/reviews/${r.id}/visibility`, { isHidden: true });
    expect(hide.status).toBe(200);
    expect(hide.body).toMatchObject({ id: r.id, isHidden: true, productId: p.id, reviewerPhone: u.phone });
    expect(await expectAggregate(p)).toEqual({ count: 0, avg: 0 });
    const again = await adm('patch', `/admin/reviews/${r.id}/visibility`, { isHidden: true });
    expect(again.status).toBe(200);
    expect(again.body.isHidden).toBe(true);
    expect(await expectAggregate(p)).toEqual({ count: 0, avg: 0 });
    const show = await adm('patch', `/admin/reviews/${r.id}/visibility`, { isHidden: false });
    expect(show.body.isHidden).toBe(false);
    expect(await expectAggregate(p)).toEqual({ count: 1, avg: 4 });
    expect((await adm('patch', `/admin/reviews/${r.id}/visibility`, { isHidden: false })).status).toBe(200);
    expectErr(await adm('patch', '/admin/reviews/999999999/visibility', { isHidden: true }), 404, 'NOT_FOUND');
    expectErr(await adm('patch', `/admin/reviews/${r.id}/visibility`, {}), 400, 'VALIDATION_ERROR');
    expectErr(await adm('patch', `/admin/reviews/${r.id}/visibility`, { isHidden: 'yes' }), 400, 'VALIDATION_ERROR');
  });
});
