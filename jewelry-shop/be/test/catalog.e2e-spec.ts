import { readFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { Redis } from 'ioredis';
import mysql from 'mysql2/promise';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { ImageStorage } from '../src/modules/media/services/image-storage.js';

const runId = Date.now().toString(36);
const CODE = `TMP-E2E-${runId.toUpperCase()}`; // tiền tố mã/sku
const NAME = `TMP E2E ${runId}`; // tiền tố tên
const PASSWORD = 'Secret123';
let seq = 0;
const n = () => ++seq;

let app: INestApplication;
let fakeApp: INestApplication;
let db: mysql.Connection;
let redis: Redis;
let adminToken = '';
let userToken = '';
let adminId = 0;

/** Storage giả: không gọi Cloudinary. */
const fake = {
  configured: true,
  failNext: false,
  uploads: [] as string[],
  deleted: [] as string[],
  counter: 0,
  reset() {
    this.failNext = false;
    this.uploads = [];
    this.deleted = [];
  },
};
const fakeStorage = {
  isConfigured: () => fake.configured,
  upload: async (_data: Buffer, folder: string) => {
    if (fake.failNext) {
      fake.failNext = false;
      throw new Error('boom');
    }
    const id = `${CODE}/img-${++fake.counter}`;
    fake.uploads.push(id);
    return { url: `https://fake.test/${id}.jpg`, publicId: id };
  },
  delete: async (publicId: string) => {
    fake.deleted.push(publicId);
  },
};

/** Storage "chưa cấu hình": app chính không bao giờ chạm Cloudinary thật, bất kể .env. */
const unconfiguredStorage = {
  isConfigured: () => false,
  upload: async () => {
    throw new Error('unconfigured');
  },
  delete: async () => undefined,
};

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);

// ---------- helpers ----------
const get = (path: string, token?: string, a = app) => {
  const r = request(a.getHttpServer()).get(`/api${path}`);
  return token ? r.set('Authorization', `Bearer ${token}`) : r;
};
const send = (method: 'post' | 'patch' | 'put' | 'delete', path: string, token?: string, body?: object, a = app) => {
  const r = request(a.getHttpServer())[method](`/api${path}`);
  if (token) r.set('Authorization', `Bearer ${token}`);
  return body ? r.send(body) : r;
};
const adm = (method: 'post' | 'patch' | 'put' | 'delete', path: string, body?: object, a = app) =>
  send(method, path, adminToken, body, a);
const admGet = (path: string) => get(path, adminToken);

async function login(phone: string) {
  const res = await request(app.getHttpServer()).post('/api/auth/login').send({ phone, password: PASSWORD });
  expect(res.status).toBe(200);
  return res.body.accessToken as string;
}
async function insertUser(role: 'admin' | 'user') {
  const email = `e2e-cat-${runId}-${n()}@e2e.test`;
  const phone = '0998' + String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
  const hash = await bcrypt.hash(PASSWORD, 4);
  const [r] = await db.query<mysql.ResultSetHeader>(
    'INSERT INTO users (fullName,email,phone,passwordHash,role,status) VALUES (?,?,?,?,?,?)',
    ['E2E Catalog', email, phone, hash, role, 'active'],
  );
  return { id: r.insertId, phone };
}

function expectErr(res: request.Response, status: number, code: string) {
  expect(res.status, JSON.stringify(res.body)).toBe(status);
  expect(res.body.code).toBe(code);
  expect(typeof res.body.timestamp).toBe('string');
}
const fieldsOf = (res: request.Response): string[] => (res.body.details ?? []).map((d: { field: string }) => d.field);

async function mkCategory(over: Record<string, unknown> = {}) {
  const res = await adm('post', '/admin/categories', { name: `${NAME} cat ${n()}`, ...over });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as { id: number; name: string; slug: string; parentId: number | null };
}
async function mkLookup(kind: 'materials' | 'gemstones', over: Record<string, unknown> = {}) {
  const res = await adm('post', `/admin/${kind}`, { name: `${NAME} ${kind} ${n()}`, ...over });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as { id: number; name: string };
}
async function mkCollection(over: Record<string, unknown> = {}) {
  const res = await adm('post', '/admin/collections', { name: `${NAME} col ${n()}`, ...over });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as { id: number; name: string; slug: string };
}
function productBody(categoryId: number, over: Record<string, unknown> = {}) {
  const i = n();
  return {
    code: `${CODE}-${i}`,
    name: `${NAME} P${i}`,
    categoryId,
    price: 1_000_000,
    targetGroup: 'unisex',
    variants: [{ sku: `${CODE}-${i}-A`, size: '', stock: 5 }],
    ...over,
  };
}
async function mkProduct(categoryId: number, over: Record<string, unknown> = {}) {
  const res = await adm('post', '/admin/products', productBody(categoryId, over));
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as any;
}
async function waitFor(cond: () => boolean, ms = 3000) {
  const end = Date.now() + ms;
  while (!cond() && Date.now() < end) await new Promise((r) => setTimeout(r, 50));
  expect(cond()).toBe(true);
}

async function cleanup() {
  await db.query("DELETE FROM orders WHERE code LIKE 'TMP-E2E-%'");
  await db.query("DELETE FROM shipping_methods WHERE name LIKE 'TMP E2E%'");
  await db.query("DELETE FROM products WHERE code LIKE 'TMP-E2E-%'");
  await db.query("DELETE FROM collections WHERE name LIKE 'TMP E2E%'");
  await db.query("DELETE FROM materials WHERE name LIKE 'TMP E2E%'");
  await db.query("DELETE FROM gemstones WHERE name LIKE 'TMP E2E%'");
  // danh mục: xóa lá trước, lặp tới khi hết
  for (let i = 0; i < 6; i++) {
    await db.query(
      "DELETE FROM categories WHERE name LIKE 'TMP E2E%' AND id NOT IN (SELECT parentId FROM (SELECT parentId FROM categories WHERE parentId IS NOT NULL) t)",
    );
  }
  await db.query("DELETE FROM token_blacklist WHERE userId IN (SELECT id FROM users WHERE email LIKE '%@e2e.test')");
  await db.query("DELETE FROM users WHERE email LIKE '%@e2e.test'");
  const keys = await redis.keys('jewelry:cache:*');
  if (keys.length) await redis.del(...keys); // chỉ là cache, an toàn để xóa
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

  const m1 = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ImageStorage)
    .useValue(unconfiguredStorage)
    .compile();
  app = m1.createNestApplication();
  configureApp(app);
  await app.init();

  const m2 = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ImageStorage)
    .useValue(fakeStorage)
    .compile();
  fakeApp = m2.createNestApplication();
  configureApp(fakeApp);
  await fakeApp.init();

  const admin = await insertUser('admin');
  adminId = admin.id;
  adminToken = await login(admin.phone);
  userToken = await login((await insertUser('user')).phone);
}, 90_000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await app?.close();
    await fakeApp?.close();
    await db?.end();
    await redis?.quit().catch(() => undefined);
  }
}, 60_000);

// =====================================================================
// 1. CÔNG KHAI
// =====================================================================
describe('API công khai', () => {
  const ctx: Record<string, any> = {};

  beforeAll(async () => {
    const R = await mkCategory({ name: `${NAME} cat root`, sortOrder: 1 });
    const C = await mkCategory({ name: `${NAME} cat child`, parentId: R.id });
    const X = await mkCategory({ name: `${NAME} cat other`, sortOrder: 2 });
    const H = await mkCategory({ name: `${NAME} cat hidden`, isActive: false });
    const HC = await mkCategory({ name: `${NAME} cat hiddenchild`, parentId: H.id });
    const m1 = await mkLookup('materials');
    const m2 = await mkLookup('materials', { isActive: false });
    const g1 = await mkLookup('gemstones');
    const g2 = await mkLookup('gemstones');
    const g3 = await mkLookup('gemstones', { isActive: false });
    const c1 = await mkCollection();
    const c2 = await mkCollection({ isActive: false });
    Object.assign(ctx, { R, C, X, H, HC, m1, m2, g1, g2, g3, c1, c2 });

    const gem = (id: number) => [{ gemstoneId: id, quantity: 1, carat: 0.5, color: 'D', clarity: 'VS1', cut: 'Excellent' }];
    ctx.P1 = await mkProduct(C.id, {
      name: `${NAME} Alpha`, targetGroup: 'women', price: 1_000_000, isFeatured: true, materialId: m1.id,
      collectionId: c1.id, gemstones: gem(g1.id), costPrice: 123,
    });
    ctx.P2 = await mkProduct(R.id, {
      targetGroup: 'men', price: 2_000_000, gemstones: gem(g2.id),
      variants: [{ sku: `${CODE}-P2-A`, size: '', stock: 0 }],
    });
    ctx.P3 = await mkProduct(R.id, { targetGroup: 'unisex', price: 3_000_000 });
    ctx.P4 = await mkProduct(X.id, { targetGroup: 'kids', price: 500_000 });
    ctx.P5 = await mkProduct(R.id, { isActive: false });
    ctx.P6 = await mkProduct(HC.id);

    const day = 86_400_000;
    const upd = (id: number, sold: number, rating: number, reviews: number, ageDays: number) =>
      db.query('UPDATE products SET soldCount=?, avgRating=?, reviewCount=?, createdAt=? WHERE id=?', [
        sold, rating, reviews, new Date(Date.now() - ageDays * day), id,
      ]);
    await upd(ctx.P1.id, 10, 4.5, 3, 5);
    await upd(ctx.P2.id, 30, 4.5, 10, 4);
    await upd(ctx.P3.id, 20, 5, 1, 3);
    await upd(ctx.P4.id, 20, 4.5, 10, 2);

    const now = Date.now();
    const promo = (pid: number, pct: number, start: number, end: number, active = 1) =>
      db.query('INSERT INTO promotions (name,productId,discountPercent,startsAt,endsAt,isActive) VALUES (?,?,?,?,?,?)', [
        `${NAME} promo`, pid, pct, new Date(now + start), new Date(now + end), active,
      ]);
    await promo(ctx.P1.id, 10, -day, day);
    await promo(ctx.P1.id, 30, -day, day);
    await promo(ctx.P1.id, 50, -3 * day, -2 * day); // đã hết hạn
    await promo(ctx.P1.id, 60, 2 * day, 3 * day); // chưa tới
    await promo(ctx.P1.id, 70, -day, day, 0); // tắt
    await promo(ctx.P3.id, 20, -day, day);
    const ck = await redis.keys('jewelry:cache:*');
    if (ck.length) await redis.del(...ck);
  }, 120_000);

  const list = (qs = '') => get(`/products?q=${encodeURIComponent(CODE)}${qs}`);
  const codes = (res: request.Response) => res.body.items.map((i: any) => i.code);
  const C_ = (...ps: string[]) => ps.map((p) => ctx[p].code);

  describe('danh mục / bộ lọc', () => {
    it('GET /categories trả cây, ẩn mục ẩn và con của mục ẩn', async () => {
      const res = await get('/categories');
      expect(res.status).toBe(200);
      const flat: any[] = [];
      const walk = (nodes: any[]) => nodes.forEach((x) => { flat.push(x); walk(x.children ?? []); });
      walk(res.body);
      const root = res.body.find((x: any) => x.id === ctx.R.id);
      expect(root).toBeDefined();
      expect(root.children.map((c: any) => c.id)).toContain(ctx.C.id);
      expect(Object.keys(root).sort()).toEqual(['children', 'id', 'name', 'parentId', 'slug', 'sortOrder']);
      const ids = flat.map((x) => x.id);
      expect(ids).not.toContain(ctx.H.id);
      expect(ids).not.toContain(ctx.HC.id);
      // sắp theo sortOrder: root(1) trước other(2)
      const top = res.body.map((x: any) => x.id);
      expect(top.indexOf(ctx.R.id)).toBeLessThan(top.indexOf(ctx.X.id));
    });
    it('materials / gemstones / collections chỉ mục đang hiển thị', async () => {
      const m = await get('/materials');
      expect(m.body.map((x: any) => x.id)).toContain(ctx.m1.id);
      expect(m.body.map((x: any) => x.id)).not.toContain(ctx.m2.id);
      expect(Object.keys(m.body[0]).sort()).toEqual(['id', 'name']);
      const g = await get('/gemstones');
      expect(g.body.map((x: any) => x.id)).toEqual(expect.arrayContaining([ctx.g1.id, ctx.g2.id]));
      expect(g.body.map((x: any) => x.id)).not.toContain(ctx.g3.id);
      const c = await get('/collections');
      expect(c.body.map((x: any) => x.id)).toContain(ctx.c1.id);
      expect(c.body.map((x: any) => x.id)).not.toContain(ctx.c2.id);
      expect(Object.keys(c.body[0]).sort()).toEqual(['bannerUrl', 'description', 'id', 'name', 'slug']);
    });
  });

  describe('GET /products', () => {
    it('chỉ trả sản phẩm đang bán và thuộc danh mục hiển thị; không lộ costPrice', async () => {
      const res = await list();
      expect(res.status).toBe(200);
      expect(codes(res).sort()).toEqual(C_('P1', 'P2', 'P3', 'P4').sort());
      expect(JSON.stringify(res.body)).not.toMatch(/costPrice/);
      const item = res.body.items.find((i: any) => i.code === ctx.P1.code);
      expect(item).toMatchObject({
        id: ctx.P1.id, name: ctx.P1.name, slug: ctx.P1.slug, price: 1_000_000, salePrice: 700_000,
        discountPercent: 30, primaryImageUrl: null, inStock: true, isFeatured: true, targetGroup: 'women',
        category: { id: ctx.C.id, name: ctx.C.name, slug: ctx.C.slug },
      });
      expect(item.avgRating).toBeCloseTo(4.5);
      expect(item.reviewCount).toBe(3);
    });
    it('phân trang và kẹp pageSize 48', async () => {
      const p1 = await list('&pageSize=3');
      expect(p1.body).toMatchObject({ page: 1, pageSize: 3, total: 4, totalPages: 2 });
      expect(p1.body.items).toHaveLength(3);
      const p2 = await list('&pageSize=3&page=2');
      expect(p2.body.items).toHaveLength(1);
      const all = [...codes(p1), ...codes(p2)];
      expect(new Set(all).size).toBe(4);
      expect((await list('&pageSize=3&page=9')).body.items).toHaveLength(0);
      expect((await list('&pageSize=100')).body.pageSize).toBe(48);
    });
    it('mặc định pageSize 12, page 1', async () => {
      const res = await list();
      expect(res.body).toMatchObject({ page: 1, pageSize: 12 });
    });
    it('tìm q theo tên (không phân biệt hoa thường) và theo mã', async () => {
      const byName = await get(`/products?q=${encodeURIComponent(`${NAME} alpha`.toLowerCase())}`);
      expect(codes(byName)).toEqual([ctx.P1.code]);
      const byCode = await get(`/products?q=${encodeURIComponent(ctx.P3.code.toLowerCase())}`);
      expect(codes(byCode)).toEqual([ctx.P3.code]);
    });
    it('lọc category (gồm con), collection, material, gemstone nhiều id', async () => {
      expect(codes(await list(`&category=${ctx.R.slug}`)).sort()).toEqual(C_('P1', 'P2', 'P3').sort());
      expect(codes(await list(`&category=${ctx.C.slug}`))).toEqual(C_('P1'));
      expect(codes(await list(`&category=${ctx.X.slug}`))).toEqual(C_('P4'));
      expect(codes(await list(`&category=${ctx.H.slug}`))).toEqual([]);
      expect(codes(await list(`&collection=${ctx.c1.slug}`))).toEqual(C_('P1'));
      expect(codes(await list(`&material=${ctx.m1.id}`))).toEqual(C_('P1'));
      expect(codes(await list(`&gemstone=${ctx.g1.id}`))).toEqual(C_('P1'));
      expect(codes(await list(`&gemstone=${ctx.g1.id},${ctx.g2.id}`)).sort()).toEqual(C_('P1', 'P2').sort());
    });
    it.each([
      ['women', ['P1', 'P3']],
      ['men', ['P2', 'P3']],
      ['kids', ['P4']],
      ['unisex', ['P3']],
    ])('targetGroup=%s', async (tg, expected) => {
      expect(codes(await list(`&targetGroup=${tg}`)).sort()).toEqual(C_(...(expected as string[])).sort());
    });
    it('targetGroup sai -> 400', async () => {
      expectErr(await list('&targetGroup=alien'), 400, 'VALIDATION_ERROR');
    });
    it('lọc giá theo giá sau khuyến mại', async () => {
      // P1 giá gốc 1.000.000 nhưng giá bán 700.000 -> không nằm trong [1.000.000, 2.400.000]
      expect(codes(await list('&minPrice=1000000&maxPrice=2400000&sort=price_asc'))).toEqual(C_('P2', 'P3'));
      expect(codes(await list('&maxPrice=700000&sort=price_asc'))).toEqual(C_('P4', 'P1'));
    });
    it('inStock / featured / onSale', async () => {
      expect(codes(await list('&inStock=true')).sort()).toEqual(C_('P1', 'P3', 'P4').sort());
      expect(codes(await list('&featured=true'))).toEqual(C_('P1'));
      expect(codes(await list('&onSale=true')).sort()).toEqual(C_('P1', 'P3').sort());
      const sale = (await list('&onSale=true')).body.items.find((i: any) => i.code === ctx.P3.code);
      expect(sale).toMatchObject({ salePrice: 2_400_000, discountPercent: 20 });
      const none = (await list()).body.items.find((i: any) => i.code === ctx.P2.code);
      expect(none).toMatchObject({ salePrice: null, discountPercent: null, inStock: false });
    });
    it('sort newest (mặc định) / price_asc / price_desc', async () => {
      expect(codes(await list())).toEqual(C_('P4', 'P3', 'P2', 'P1'));
      expect(codes(await list('&sort=newest'))).toEqual(C_('P4', 'P3', 'P2', 'P1'));
      expect(codes(await list('&sort=price_asc'))).toEqual(C_('P4', 'P1', 'P2', 'P3'));
      expect(codes(await list('&sort=price_desc'))).toEqual(C_('P3', 'P2', 'P1', 'P4'));
    });
    it('sort bestseller / rating đúng thứ tự và ổn định khi bằng nhau', async () => {
      const best = codes(await list('&sort=bestseller'));
      expect(best[0]).toBe(ctx.P2.code);
      expect(best[3]).toBe(ctx.P1.code);
      expect(best.slice(1, 3).sort()).toEqual(C_('P3', 'P4').sort());
      const rating = codes(await list('&sort=rating'));
      expect(rating[0]).toBe(ctx.P3.code);
      expect(rating[3]).toBe(ctx.P1.code); // 4.5 nhưng ít đánh giá hơn
      expect(rating.slice(1, 3).sort()).toEqual(C_('P2', 'P4').sort());
      // ổn định: gọi lại và phân trang từng sản phẩm cho cùng thứ tự
      for (const sort of ['bestseller', 'rating']) {
        const expected = codes(await list(`&sort=${sort}`));
        expect(codes(await list(`&sort=${sort}`))).toEqual(expected);
        const paged: string[] = [];
        for (let p = 1; p <= 4; p++) paged.push(...codes(await list(`&sort=${sort}&pageSize=1&page=${p}`)));
        expect(paged).toEqual(expected);
      }
    });
    it('sort sai -> 400', async () => {
      expectErr(await list('&sort=cheapest'), 400, 'VALIDATION_ERROR');
    });
  });

  describe('GET /products/:slug', () => {
    it('trả đầy đủ trường, không có costPrice', async () => {
      const res = await get(`/products/${ctx.P1.slug}`);
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toMatch(/costPrice/);
      expect(res.body).toMatchObject({
        id: ctx.P1.id, code: ctx.P1.code, slug: ctx.P1.slug, price: 1_000_000, salePrice: 700_000, discountPercent: 30,
        targetGroup: 'women', isFeatured: true, inStock: true, soldCount: 10,
        category: { id: ctx.C.id, name: ctx.C.name, slug: ctx.C.slug },
        material: { id: ctx.m1.id, name: ctx.m1.name },
        collection: { id: ctx.c1.id, name: ctx.c1.name, slug: ctx.c1.slug },
      });
      for (const k of ['description', 'weight', 'warrantyInfo', 'certificate', 'avgRating', 'reviewCount', 'images', 'variants', 'gemstones', 'related', 'breadcrumb']) {
        expect(res.body).toHaveProperty(k);
      }
      expect(res.body.breadcrumb.map((b: any) => b.id)).toEqual([ctx.R.id, ctx.C.id]);
      expect(res.body.variants).toHaveLength(1);
      expect(res.body.variants[0]).toMatchObject({ sku: ctx.P1.variants[0].sku, size: '', stock: 5 });
      expect(res.body.gemstones[0]).toMatchObject({
        gemstoneId: ctx.g1.id, name: ctx.g1.name, quantity: 1, color: 'D', clarity: 'VS1', cut: 'Excellent',
      });
      expect(res.body.gemstones[0].carat).toBeCloseTo(0.5);
    });
    it('related cùng danh mục, loại trừ chính nó và sản phẩm ẩn', async () => {
      const res = await get(`/products/${ctx.P2.slug}`);
      const ids = res.body.related.map((r: any) => r.id);
      expect(ids).toContain(ctx.P3.id);
      expect(ids).not.toContain(ctx.P2.id);
      expect(ids).not.toContain(ctx.P5.id);
      expect(res.body.related[0]).toHaveProperty('primaryImageUrl');
    });
    it('related tối đa 8', async () => {
      const cat = await mkCategory();
      const created = await Promise.all(Array.from({ length: 10 }, () => mkProduct(cat.id)));
      const res = await get(`/products/${created[0].slug}`);
      expect(res.body.related).toHaveLength(8);
      expect(res.body.related.map((r: any) => r.id)).not.toContain(created[0].id);
    });
    it('ẩn hoặc không tồn tại -> 404 NOT_FOUND', async () => {
      expectErr(await get(`/products/${ctx.P5.slug}`), 404, 'NOT_FOUND');
      expectErr(await get('/products/khong-ton-tai-xyz'), 404, 'NOT_FOUND');
    });
    it('chỉ trả biến thể isActive', async () => {
      const cat = await mkCategory();
      const p = await mkProduct(cat.id, {
        variants: [{ sku: `${CODE}-V-A`, size: '10', stock: 1 }, { sku: `${CODE}-V-B`, size: '11', stock: 1, isActive: false }],
      });
      const res = await get(`/products/${p.slug}`);
      expect(res.body.variants.map((v: any) => v.sku)).toEqual([`${CODE}-V-A`]);
    });
  });
});

// =====================================================================
// 2. QUẢN TRỊ
// =====================================================================
describe('Phân quyền /admin/**', () => {
  const endpoints: Array<[string, string]> = [
    ['get', '/admin/categories'], ['post', '/admin/categories'], ['patch', '/admin/categories/1'], ['delete', '/admin/categories/1'],
    ['get', '/admin/materials'], ['post', '/admin/materials'], ['patch', '/admin/materials/1'], ['delete', '/admin/materials/1'],
    ['get', '/admin/gemstones'], ['post', '/admin/gemstones'], ['patch', '/admin/gemstones/1'], ['delete', '/admin/gemstones/1'],
    ['get', '/admin/collections'], ['post', '/admin/collections'], ['patch', '/admin/collections/1'], ['delete', '/admin/collections/1'],
    ['get', '/admin/products'], ['get', '/admin/products/1'], ['post', '/admin/products'], ['patch', '/admin/products/1'],
    ['delete', '/admin/products/1'], ['patch', '/admin/products/1/variants/1/stock'],
    ['post', '/admin/products/1/images'], ['patch', '/admin/products/1/images/1'], ['put', '/admin/products/1/images/order'],
    ['delete', '/admin/products/1/images/1'],
  ];
  it.each(endpoints)('%s %s: 401 không token, 403 role user', async (method, path) => {
    const call = (token?: string) => {
      const r = request(app.getHttpServer())[method as 'get'](`/api${path}`);
      return token ? r.set('Authorization', `Bearer ${token}`) : r;
    };
    expect((await call()).status).toBe(401);
    expect((await call(userToken)).status).toBe(403);
  });
});

describe('Admin: danh mục', () => {
  it('CRUD đầy đủ, slug tự sinh', async () => {
    const parent = await mkCategory({ name: `${NAME} Nhẫn cưới` });
    expect(parent.slug).toMatch(/^tmp-e2e-.*-nhan-cuoi$/);
    const child = await mkCategory({ parentId: parent.id, sortOrder: 3 });
    const list = await admGet('/admin/categories');
    const row = list.body.find((c: any) => c.id === parent.id);
    expect(row).toMatchObject({ childCount: 1, productCount: 0, isActive: true, parentId: null });
    const upd = await adm('patch', `/admin/categories/${child.id}`, { name: `${NAME} renamed`, isActive: false, sortOrder: 9 });
    expect(upd.status).toBe(200);
    expect(upd.body).toMatchObject({ name: `${NAME} renamed`, isActive: false, sortOrder: 9 });
    expect((await adm('delete', `/admin/categories/${child.id}`)).status).toBe(204);
    expect((await adm('delete', `/admin/categories/${parent.id}`)).status).toBe(204);
    expectErr(await adm('delete', `/admin/categories/${parent.id}`), 404, 'NOT_FOUND');
  });
  it('slug trùng -> 409 SLUG_ALREADY_EXISTS kèm details.field=slug; PATCH đúng giá trị cũ không lỗi', async () => {
    const a = await mkCategory();
    const dup = await adm('post', '/admin/categories', { name: `${NAME} other ${n()}`, slug: a.slug });
    expectErr(dup, 409, 'SLUG_ALREADY_EXISTS');
    expect(fieldsOf(dup)).toContain('slug');
    const same = await adm('patch', `/admin/categories/${a.id}`, { name: a.name, slug: a.slug });
    expect(same.status).toBe(200);
    const b = await mkCategory();
    expectErr(await adm('patch', `/admin/categories/${b.id}`, { slug: a.slug }), 409, 'SLUG_ALREADY_EXISTS');
  });
  it('vòng cha-con và tự làm cha -> 400 VALIDATION_ERROR', async () => {
    const a = await mkCategory();
    const b = await mkCategory({ parentId: a.id });
    const c = await mkCategory({ parentId: b.id });
    expectErr(await adm('patch', `/admin/categories/${a.id}`, { parentId: a.id }), 400, 'VALIDATION_ERROR');
    expectErr(await adm('patch', `/admin/categories/${a.id}`, { parentId: c.id }), 400, 'VALIDATION_ERROR');
  });
  it('validate tên và parentId không tồn tại', async () => {
    expectErr(await adm('post', '/admin/categories', { name: 'A' }), 400, 'VALIDATION_ERROR');
    expectErr(await adm('post', '/admin/categories', { name: 'x'.repeat(101) }), 400, 'VALIDATION_ERROR');
    const res = await adm('post', '/admin/categories', { name: `${NAME} orphan`, parentId: 999999999 });
    expect([400, 404]).toContain(res.status);
  });
  it('xóa khi có con hoặc có sản phẩm -> 409 RESOURCE_IN_USE', async () => {
    const parent = await mkCategory();
    const child = await mkCategory({ parentId: parent.id });
    expectErr(await adm('delete', `/admin/categories/${parent.id}`), 409, 'RESOURCE_IN_USE');
    await mkProduct(child.id);
    expectErr(await adm('delete', `/admin/categories/${child.id}`), 409, 'RESOURCE_IN_USE');
    const row = (await admGet('/admin/categories')).body.find((c: any) => c.id === child.id);
    expect(row.productCount).toBe(1);
  });
  it('cache: sau khi admin sửa danh mục, GET /categories phản ánh ngay', async () => {
    const cat = await mkCategory();
    const before = await get('/categories');
    expect(before.body.find((c: any) => c.id === cat.id)).toBeDefined();
    await adm('patch', `/admin/categories/${cat.id}`, { isActive: false });
    const after = await get('/categories');
    expect(after.body.find((c: any) => c.id === cat.id)).toBeUndefined();
    await adm('patch', `/admin/categories/${cat.id}`, { isActive: true, name: `${NAME} cache renamed` });
    const back = await get('/categories');
    expect(back.body.find((c: any) => c.id === cat.id)?.name).toBe(`${NAME} cache renamed`);
  });
});

describe.each([['materials'], ['gemstones']] as const)('Admin: %s', (kind) => {
  it('CRUD, productCount, ẩn khỏi API công khai', async () => {
    const a = await mkLookup(kind);
    const list = await admGet(`/admin/${kind}`);
    expect(list.body.find((x: any) => x.id === a.id)).toMatchObject({ name: a.name, productCount: 0, isActive: true });
    expect((await adm('patch', `/admin/${kind}/${a.id}`, { isActive: false })).status).toBe(200);
    expect((await get(`/${kind}`)).body.map((x: any) => x.id)).not.toContain(a.id);
    expect((await adm('delete', `/admin/${kind}/${a.id}`)).status).toBe(204);
    expectErr(await adm('delete', `/admin/${kind}/${a.id}`), 404, 'NOT_FOUND');
  });
  it('trùng tên -> 409 NAME_ALREADY_EXISTS (details.field=name); PATCH đúng tên cũ không lỗi', async () => {
    const a = await mkLookup(kind);
    const dup = await adm('post', `/admin/${kind}`, { name: a.name });
    expectErr(dup, 409, 'NAME_ALREADY_EXISTS');
    expect(fieldsOf(dup)).toContain('name');
    expect((await adm('patch', `/admin/${kind}/${a.id}`, { name: a.name })).status).toBe(200);
    const b = await mkLookup(kind);
    expectErr(await adm('patch', `/admin/${kind}/${b.id}`, { name: a.name }), 409, 'NAME_ALREADY_EXISTS');
  });
  it('xóa khi đang được sản phẩm dùng -> 409 RESOURCE_IN_USE', async () => {
    const a = await mkLookup(kind);
    const cat = await mkCategory();
    await mkProduct(
      cat.id,
      kind === 'materials' ? { materialId: a.id } : { gemstones: [{ gemstoneId: a.id, quantity: 1 }] },
    );
    expectErr(await adm('delete', `/admin/${kind}/${a.id}`), 409, 'RESOURCE_IN_USE');
    const row = (await admGet(`/admin/${kind}`)).body.find((x: any) => x.id === a.id);
    expect(row.productCount).toBe(1);
  });
  it('validate tên', async () => {
    expectErr(await adm('post', `/admin/${kind}`, { name: '' }), 400, 'VALIDATION_ERROR');
  });
});

describe('Admin: bộ sưu tập', () => {
  it('CRUD, productCount, slug trùng, PATCH giá trị cũ', async () => {
    const c = await mkCollection({ description: 'mô tả', bannerUrl: 'https://x.test/b.jpg' });
    expect(c).toMatchObject({ description: 'mô tả', bannerUrl: 'https://x.test/b.jpg' });
    const row = (await admGet('/admin/collections')).body.find((x: any) => x.id === c.id);
    expect(row.productCount).toBe(0);
    const dup = await adm('post', '/admin/collections', { name: `${NAME} col other ${n()}`, slug: c.slug });
    expectErr(dup, 409, 'SLUG_ALREADY_EXISTS');
    expect(fieldsOf(dup)).toContain('slug');
    expect((await adm('patch', `/admin/collections/${c.id}`, { name: c.name, slug: c.slug })).status).toBe(200);
    expect((await adm('patch', `/admin/collections/${c.id}`, { description: 'mới' })).body.description).toBe('mới');
    expect((await adm('delete', `/admin/collections/${c.id}`)).status).toBe(204);
  });
  it('xóa khi có sản phẩm -> 409 RESOURCE_IN_USE', async () => {
    const c = await mkCollection();
    const cat = await mkCategory();
    await mkProduct(cat.id, { collectionId: c.id });
    expectErr(await adm('delete', `/admin/collections/${c.id}`), 409, 'RESOURCE_IN_USE');
    expect((await admGet('/admin/collections')).body.find((x: any) => x.id === c.id).productCount).toBe(1);
  });
});

describe('Admin: sản phẩm', () => {
  let cat: { id: number };
  beforeAll(async () => {
    cat = await mkCategory();
  });

  it('tạo đầy đủ -> 201 gồm costPrice, ảnh, biến thể, đá quý; GET list/detail admin', async () => {
    const g = await mkLookup('gemstones');
    const p = await mkProduct(cat.id, {
      costPrice: 500_000, weight: 3.25, description: 'mô tả', warrantyInfo: 'bh', certificate: 'GIA',
      gemstones: [{ gemstoneId: g.id, quantity: 2, carat: 0.25 }],
      variants: [{ sku: `${CODE}-D-1`, size: '10', stock: 3 }, { sku: `${CODE}-D-2`, size: '11', stock: 4 }],
    });
    expect(p).toMatchObject({ costPrice: 500_000, price: 1_000_000, isActive: true, categoryId: cat.id });
    expect(p.variants).toHaveLength(2);
    expect(p.gemstones).toHaveLength(1);
    const detail = await admGet(`/admin/products/${p.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.costPrice).toBe(500_000);
    const list = await admGet(`/admin/products?q=${encodeURIComponent(p.code)}`);
    expect(list.body.items[0]).toMatchObject({
      id: p.id, code: p.code, categoryId: cat.id, isActive: true, totalStock: 7, primaryImageUrl: null,
    });
    expect(list.body.items[0]).toHaveProperty('categoryName');
    expect((await admGet(`/admin/products?categoryId=${cat.id}&isActive=false&q=${CODE}`)).body.items.map((i: any) => i.id)).not.toContain(p.id);
    expectErr(await admGet('/admin/products/999999999'), 404, 'NOT_FOUND');
  });

  it('mã trùng -> 409 PRODUCT_CODE_ALREADY_EXISTS (details.field=code); PATCH đúng mã cũ không lỗi', async () => {
    const a = await mkProduct(cat.id);
    const dup = await adm('post', '/admin/products', productBody(cat.id, { code: a.code }));
    expectErr(dup, 409, 'PRODUCT_CODE_ALREADY_EXISTS');
    expect(fieldsOf(dup)).toContain('code');
    expect((await adm('patch', `/admin/products/${a.id}`, { code: a.code, slug: a.slug, name: a.name })).status).toBe(200);
    const b = await mkProduct(cat.id);
    expectErr(await adm('patch', `/admin/products/${b.id}`, { code: a.code }), 409, 'PRODUCT_CODE_ALREADY_EXISTS');
  });

  it('slug trùng -> 409 SLUG_ALREADY_EXISTS; slug tự sinh thêm hậu tố khi trùng tên', async () => {
    const a = await mkProduct(cat.id);
    const dup = await adm('post', '/admin/products', productBody(cat.id, { slug: a.slug }));
    expectErr(dup, 409, 'SLUG_ALREADY_EXISTS');
    expect(fieldsOf(dup)).toContain('slug');
    const sameName = await adm('post', '/admin/products', productBody(cat.id, { name: a.name }));
    expect(sameName.status).toBe(201);
    expect(sameName.body.slug).toBe(`${a.slug}-2`);
  });

  it('sku trùng -> 409 SKU_ALREADY_EXISTS với variants[i].sku đúng chỉ số; tạo nguyên tử', async () => {
    const a = await mkProduct(cat.id);
    const body = productBody(cat.id, {
      variants: [
        { sku: `${CODE}-AT-NEW`, size: '1', stock: 1 },
        { sku: a.variants[0].sku, size: '2', stock: 1 },
      ],
    });
    const res = await adm('post', '/admin/products', body);
    expectErr(res, 409, 'SKU_ALREADY_EXISTS');
    expect(fieldsOf(res)).toContain('variants[1].sku');
    const [p] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM products WHERE code=?', [body.code]);
    const [v] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM product_variants WHERE sku=?', [`${CODE}-AT-NEW`]);
    expect(p).toHaveLength(0);
    expect(v).toHaveLength(0);
  });

  it('sku trùng khi PATCH variants -> 409 kèm field', async () => {
    const a = await mkProduct(cat.id);
    const b = await mkProduct(cat.id);
    const res = await adm('patch', `/admin/products/${b.id}`, {
      variants: [{ id: b.variants[0].id, sku: a.variants[0].sku, size: '' }],
    });
    expectErr(res, 409, 'SKU_ALREADY_EXISTS');
    expect(fieldsOf(res)).toContain('variants[0].sku');
  });

  it.each([
    ['price = 0', { price: 0 }],
    ['price âm', { price: -5 }],
    ['price không nguyên', { price: 1.5 }],
    ['costPrice âm', { costPrice: -1 }],
    ['tên 1 ký tự', { name: 'A' }],
    ['tên 201 ký tự', { name: 'x'.repeat(201) }],
    ['mã 1 ký tự', { code: 'A' }],
    ['không có biến thể', { variants: [] }],
    ['stock âm', { variants: [{ sku: `${CODE}-NEG`, size: '', stock: -1 }] }],
    ['stock không nguyên', { variants: [{ sku: `${CODE}-FR`, size: '', stock: 1.5 }] }],
    ['slug sai định dạng', { slug: 'Có Dấu' }],
    ['targetGroup sai', { targetGroup: 'alien' }],
  ])('validate: %s -> 400 VALIDATION_ERROR', async (_n, over) => {
    expectErr(await adm('post', '/admin/products', productBody(cat.id, over)), 400, 'VALIDATION_ERROR');
  });

  it('danh mục/chất liệu/bộ sưu tập không tồn tại -> lỗi 4xx, không tạo gì', async () => {
    const bad = productBody(cat.id, { categoryId: 999999999 });
    const res = await adm('post', '/admin/products', bad);
    expect([400, 404]).toContain(res.status);
    const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM products WHERE code=?', [bad.code]);
    expect(rows).toHaveLength(0);
    expect([400, 404]).toContain((await adm('post', '/admin/products', productBody(cat.id, { materialId: 999999999 }))).status);
    expect([400, 404]).toContain((await adm('post', '/admin/products', productBody(cat.id, { collectionId: 999999999 }))).status);
  });

  it('size trùng trong cùng sản phẩm bị từ chối', async () => {
    const res = await adm('post', '/admin/products', productBody(cat.id, {
      variants: [{ sku: `${CODE}-S1`, size: '9', stock: 1 }, { sku: `${CODE}-S2`, size: '9', stock: 1 }],
    }));
    expect([400, 409]).toContain(res.status);
  });

  it('PATCH variants đồng bộ: ẩn biến thể vắng mặt, không xóa, không ghi đè stock; tạo mới', async () => {
    const p = await mkProduct(cat.id, {
      variants: [{ sku: `${CODE}-SY-A`, size: '1', stock: 5 }, { sku: `${CODE}-SY-B`, size: '2', stock: 6 }],
    });
    const [a, b] = p.variants;
    const res = await adm('patch', `/admin/products/${p.id}`, {
      variants: [
        { id: a.id, sku: a.sku, size: '1', stock: 999, isActive: true },
        { sku: `${CODE}-SY-C`, size: '3', stock: 7 },
      ],
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const byId = (id: number) => res.body.variants.find((v: any) => v.id === id);
    expect(byId(a.id)).toMatchObject({ stock: 5, isActive: true });
    expect(byId(b.id)).toMatchObject({ stock: 6, isActive: false });
    const created = res.body.variants.find((v: any) => v.sku === `${CODE}-SY-C`);
    expect(created).toMatchObject({ stock: 7, isActive: true });
    expect(res.body.variants).toHaveLength(3);
    // công khai chỉ thấy biến thể active
    const pub = await get(`/products/${p.slug}`);
    expect(pub.body.variants.map((v: any) => v.sku).sort()).toEqual([`${CODE}-SY-A`, `${CODE}-SY-C`]);
    // sửa sku/size của biến thể có sẵn
    const edit = await adm('patch', `/admin/products/${p.id}`, {
      variants: [{ id: a.id, sku: `${CODE}-SY-A2`, size: '4' }, { id: created.id, sku: created.sku, size: '3' }],
    });
    expect(edit.body.variants.find((v: any) => v.id === a.id)).toMatchObject({ sku: `${CODE}-SY-A2`, size: '4' });
  });

  it('PATCH gemstones thay thế toàn bộ', async () => {
    const g1 = await mkLookup('gemstones');
    const g2 = await mkLookup('gemstones');
    const p = await mkProduct(cat.id, { gemstones: [{ gemstoneId: g1.id, quantity: 1 }, { gemstoneId: g2.id, quantity: 2 }] });
    expect(p.gemstones).toHaveLength(2);
    const r1 = await adm('patch', `/admin/products/${p.id}`, { gemstones: [{ gemstoneId: g2.id, quantity: 5 }] });
    expect(r1.body.gemstones).toHaveLength(1);
    expect(r1.body.gemstones[0]).toMatchObject({ gemstoneId: g2.id, quantity: 5 });
    const r2 = await adm('patch', `/admin/products/${p.id}`, { gemstones: [] });
    expect(r2.body.gemstones).toHaveLength(0);
    const r3 = await adm('patch', `/admin/products/${p.id}`, { name: `${NAME} no-touch` });
    expect(r3.status).toBe(200);
  });

  it('PATCH các trường cơ bản và ẩn sản phẩm', async () => {
    const p = await mkProduct(cat.id);
    const r = await adm('patch', `/admin/products/${p.id}`, { price: 2_500_000, isActive: false, isFeatured: true });
    expect(r.body).toMatchObject({ price: 2_500_000, isActive: false, isFeatured: true });
    expectErr(await get(`/products/${p.slug}`), 404, 'NOT_FOUND');
    expectErr(await adm('patch', '/admin/products/999999999', { price: 5 }), 404, 'NOT_FOUND');
  });

  describe('tồn kho', () => {
    it('delta / set / validate / không đủ tồn', async () => {
      const p = await mkProduct(cat.id);
      const v = p.variants[0];
      const path = `/admin/products/${p.id}/variants/${v.id}/stock`;
      const d = await adm('patch', path, { delta: -2 });
      expect(d.status).toBe(200);
      expect(d.body).toEqual({ id: v.id, sku: v.sku, size: v.size, stock: 3 });
      expect((await adm('patch', path, { delta: 4 })).body.stock).toBe(7);
      expect((await adm('patch', path, { set: 10 })).body.stock).toBe(10);
      expect((await adm('patch', path, { set: 0 })).body.stock).toBe(0);
      expectErr(await adm('patch', path, { delta: -1 }), 409, 'INSUFFICIENT_STOCK');
      await adm('patch', path, { set: 2 });
      expectErr(await adm('patch', path, { delta: -3 }), 409, 'INSUFFICIENT_STOCK');
      expectErr(await adm('patch', path, { set: -1 }), 400, 'VALIDATION_ERROR');
      expectErr(await adm('patch', path, { delta: -1, set: 5 }), 400, 'VALIDATION_ERROR');
      expectErr(await adm('patch', path, {}), 400, 'VALIDATION_ERROR');
      const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT stock FROM product_variants WHERE id=?', [v.id]);
      expect(rows[0].stock).toBe(2);
      expectErr(await adm('patch', `/admin/products/${p.id}/variants/999999999/stock`, { delta: 1 }), 404, 'NOT_FOUND');
    });

    it('cạnh tranh: tồn 10, 12 request delta -1 song song -> đúng 10 thành công, 2 thất bại, tồn cuối 0', async () => {
      const p = await mkProduct(cat.id, { variants: [{ sku: `${CODE}-RACE`, size: '', stock: 10 }] });
      const path = `/admin/products/${p.id}/variants/${p.variants[0].id}/stock`;
      const results = await Promise.all(Array.from({ length: 12 }, () => adm('patch', path, { delta: -1 })));
      const ok = results.filter((r) => r.status === 200).length;
      const fail = results.filter((r) => r.status === 409 && r.body.code === 'INSUFFICIENT_STOCK').length;
      expect(ok).toBe(10);
      expect(fail).toBe(2);
      const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT stock FROM product_variants WHERE id=?', [p.variants[0].id]);
      expect(rows[0].stock).toBe(0);
    });
  });

  describe('xóa sản phẩm', () => {
    it('bị chặn 409 RESOURCE_IN_USE khi có order_items tham chiếu; xóa được sau khi gỡ đơn, kéo theo dữ liệu con', async () => {
      const g = await mkLookup('gemstones');
      const p = await mkProduct(cat.id, { gemstones: [{ gemstoneId: g.id, quantity: 1 }] });
      await db.query('INSERT INTO product_images (productId,url,publicId,sortOrder,isPrimary) VALUES (?,?,?,0,1)', [p.id, 'https://x.test/i.jpg', `${CODE}/x`]);
      await db.query('INSERT INTO promotions (name,productId,discountPercent,startsAt,endsAt,isActive) VALUES (?,?,?,?,?,1)', [
        `${NAME} promo`, p.id, 10, new Date(Date.now() - 1000), new Date(Date.now() + 86_400_000),
      ]);
      const [ship] = await db.query<mysql.ResultSetHeader>('INSERT INTO shipping_methods (name,fee) VALUES (?,0)', [`${NAME} ship`]);
      const orderCode = `${CODE}-ORD-${n()}`;
      const [ord] = await db.query<mysql.ResultSetHeader>(
        `INSERT INTO orders (code,userId,receiverName,receiverPhone,provinceName,wardName,addressDetail,shippingMethodId,subtotal,shippingFee,total,paymentMethod)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [orderCode, adminId, 'E2E', '0999000000', 'P', 'W', 'A', ship.insertId, 1000000, 0, 1000000, 'cod'],
      );
      await db.query(
        'INSERT INTO order_items (orderId,variantId,productName,productCode,size,unitPrice,quantity,lineTotal) VALUES (?,?,?,?,?,?,?,?)',
        [ord.insertId, p.variants[0].id, p.name, p.code, '', 1000000, 1, 1000000],
      );
      expectErr(await adm('delete', `/admin/products/${p.id}`), 409, 'RESOURCE_IN_USE');
      expect((await admGet(`/admin/products/${p.id}`)).status).toBe(200);

      await db.query('DELETE FROM orders WHERE id=?', [ord.insertId]);
      expect((await adm('delete', `/admin/products/${p.id}`)).status).toBe(204);
      for (const t of ['product_variants', 'product_images', 'product_gemstones', 'promotions']) {
        const [rows] = await db.query<mysql.RowDataPacket[]>(`SELECT id FROM ${t} WHERE productId=?`, [p.id]);
        expect(rows, t).toHaveLength(0);
      }
      expectErr(await adm('delete', `/admin/products/${p.id}`), 404, 'NOT_FOUND');
    });
  });
});

// =====================================================================
// 3. ẢNH
// =====================================================================
describe('Ảnh sản phẩm: chưa cấu hình Cloudinary (app thật)', () => {
  let pid: number;
  beforeAll(async () => {
    pid = (await mkProduct((await mkCategory()).id)).id;
  });
  const up = (buf: Buffer, mime: string, name = 'a.jpg') =>
    request(app.getHttpServer())
      .post(`/api/admin/products/${pid}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('files', buf, { filename: name, contentType: mime });

  it('đuôi .jpg nhưng nội dung không phải ảnh -> 400 INVALID_IMAGE', async () => {
    expectErr(await up(Buffer.from('this is not an image'), 'image/jpeg'), 400, 'INVALID_IMAGE');
  });
  it('MIME không phải ảnh -> 400 INVALID_IMAGE', async () => {
    expectErr(await up(JPG, 'text/plain'), 400, 'INVALID_IMAGE');
  });
  it('MIME không khớp chữ ký -> 400 INVALID_IMAGE', async () => {
    expectErr(await up(PNG, 'image/jpeg'), 400, 'INVALID_IMAGE');
  });
  it('> 5MB -> 400 INVALID_IMAGE', async () => {
    const big = Buffer.concat([JPG, Buffer.alloc(5 * 1024 * 1024 + 10)]);
    expectErr(await up(big, 'image/jpeg'), 400, 'INVALID_IMAGE');
  });
  it('không gửi file -> 400', async () => {
    const res = await request(app.getHttpServer()).post(`/api/admin/products/${pid}/images`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
  it('ảnh hợp lệ khi chưa cấu hình -> 503 UPLOAD_NOT_CONFIGURED', async () => {
    expectErr(await up(JPG, 'image/jpeg'), 503, 'UPLOAD_NOT_CONFIGURED');
    const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT id FROM product_images WHERE productId=?', [pid]);
    expect(rows).toHaveLength(0);
  });
  it('sản phẩm không tồn tại -> 404', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/admin/products/999999999/images')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('files', JPG, { filename: 'a.jpg', contentType: 'image/jpeg' });
    expectErr(res, 404, 'NOT_FOUND');
  });
});

describe('Ảnh sản phẩm: luồng đầy đủ với storage giả', () => {
  let cat: { id: number };
  beforeAll(async () => {
    cat = await mkCategory();
  });
  beforeEach(() => fake.reset());

  const upMany = (pid: number, count: number, buf = PNG, mime = 'image/png') => {
    const r = request(fakeApp.getHttpServer()).post(`/api/admin/products/${pid}/images`).set('Authorization', `Bearer ${adminToken}`);
    for (let i = 0; i < count; i++) r.attach('files', buf, { filename: `f${i}.png`, contentType: mime });
    return r;
  };
  const imagesOf = async (pid: number) => {
    const [rows] = await db.query<mysql.RowDataPacket[]>('SELECT id,isPrimary,sortOrder,publicId FROM product_images WHERE productId=? ORDER BY sortOrder,id', [pid]);
    return rows;
  };

  it('tải nhiều ảnh: 201, ảnh đầu tiên là đại diện, sortOrder tăng dần; gọi thêm không đổi ảnh đại diện', async () => {
    const p = await mkProduct(cat.id);
    const r = await upMany(p.id, 3);
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    expect(r.body).toHaveLength(3);
    expect(r.body.map((i: any) => i.isPrimary)).toEqual([true, false, false]);
    expect(r.body.every((i: any) => i.url.startsWith('https://fake.test/'))).toBe(true);
    const sorted = r.body.map((i: any) => i.sortOrder);
    expect([...sorted].sort((a, b) => a - b)).toEqual(sorted);
    expect(fake.uploads).toHaveLength(3);
    const more = await upMany(p.id, 1);
    expect(more.body[0].isPrimary).toBe(false);
    const pub = await get(`/products/${p.slug}`);
    expect(pub.body.images).toHaveLength(4);
    expect(pub.body.images.filter((i: any) => i.isPrimary)).toHaveLength(1);
    const list = await get(`/products?q=${encodeURIComponent(p.code)}`);
    expect(list.body.items[0].primaryImageUrl).toBe(r.body[0].url);
  });

  it('giới hạn 10 ảnh/sản phẩm và 8 file/lần -> 400 IMAGE_LIMIT_EXCEEDED', async () => {
    const p = await mkProduct(cat.id);
    expectErr(await upMany(p.id, 9), 400, 'IMAGE_LIMIT_EXCEEDED');
    expect((await upMany(p.id, 8)).status).toBe(201);
    expect((await upMany(p.id, 2)).status).toBe(201);
    expectErr(await upMany(p.id, 1), 400, 'IMAGE_LIMIT_EXCEEDED');
    expect(await imagesOf(p.id)).toHaveLength(10);
  });

  it('lỗi lưu trữ -> 502 UPLOAD_FAILED, không để lại dòng DB mồ côi', async () => {
    const p = await mkProduct(cat.id);
    fake.failNext = true;
    expectErr(await upMany(p.id, 2), 502, 'UPLOAD_FAILED');
    expect(await imagesOf(p.id)).toHaveLength(0);
    // ảnh đã lên của request lỗi được dọn
    await waitFor(() => fake.deleted.length === fake.uploads.length);
  });

  it('PATCH isPrimary giữ đúng một ảnh đại diện', async () => {
    const p = await mkProduct(cat.id);
    const imgs = (await upMany(p.id, 3)).body;
    const r = await adm('patch', `/admin/products/${p.id}/images/${imgs[2].id}`, { isPrimary: true }, fakeApp);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body).toMatchObject({ id: imgs[2].id, isPrimary: true });
    const rows = await imagesOf(p.id);
    expect(rows.filter((x) => x.isPrimary)).toHaveLength(1);
    expect(rows.find((x) => x.isPrimary)!.id).toBe(imgs[2].id);
    expectErr(await adm('patch', `/admin/products/${p.id}/images/999999999`, { isPrimary: true }, fakeApp), 404, 'NOT_FOUND');
  });

  it('PUT /order sắp lại sortOrder; sai tập id -> 400', async () => {
    const p = await mkProduct(cat.id);
    const imgs = (await upMany(p.id, 3)).body.map((i: any) => i.id) as number[];
    const order = [imgs[2], imgs[0], imgs[1]];
    const r = await adm('put', `/admin/products/${p.id}/images/order`, { imageIds: order }, fakeApp);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect((await imagesOf(p.id)).map((x) => x.id)).toEqual(order);
    expectErr(await adm('put', `/admin/products/${p.id}/images/order`, { imageIds: [imgs[0], imgs[1]] }, fakeApp), 400, 'VALIDATION_ERROR');
    expectErr(await adm('put', `/admin/products/${p.id}/images/order`, { imageIds: [imgs[0], imgs[1], 999999999] }, fakeApp), 400, 'VALIDATION_ERROR');
    expectErr(await adm('put', `/admin/products/${p.id}/images/order`, { imageIds: [imgs[0], imgs[0], imgs[1]] }, fakeApp), 400, 'VALIDATION_ERROR');
  });

  it('xóa ảnh đại diện thì ảnh kế tiếp (theo sortOrder) thành đại diện; storage nhận lệnh xóa', async () => {
    const p = await mkProduct(cat.id);
    const imgs = (await upMany(p.id, 3)).body as any[];
    const first = (await imagesOf(p.id))[0];
    const res = await adm('delete', `/admin/products/${p.id}/images/${imgs[0].id}`, undefined, fakeApp);
    expect(res.status).toBe(204);
    const rows = await imagesOf(p.id);
    expect(rows).toHaveLength(2);
    expect(rows.filter((x) => x.isPrimary)).toHaveLength(1);
    expect(rows[0].isPrimary).toBeTruthy();
    expect(rows[0].id).toBe(imgs[1].id);
    await waitFor(() => fake.deleted.includes(first.publicId));
    expectErr(await adm('delete', `/admin/products/${p.id}/images/${imgs[0].id}`, undefined, fakeApp), 404, 'NOT_FOUND');
  });

  it('xóa sản phẩm: ảnh bị xóa khỏi DB và storage nhận lệnh xóa', async () => {
    const p = await mkProduct(cat.id);
    await upMany(p.id, 2);
    const ids = (await imagesOf(p.id)).map((x) => x.publicId);
    expect((await adm('delete', `/admin/products/${p.id}`, undefined, fakeApp)).status).toBe(204);
    expect(await imagesOf(p.id)).toHaveLength(0);
    await waitFor(() => ids.every((id) => fake.deleted.includes(id)));
  });
});
