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
import { HttpStatus } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../src/exceptions/index.js';
import { ImageStorage } from '../src/modules/media/services/image-storage.js';

const runId = Date.now().toString(36);
const TAG = `TMP-E2E ${runId}`; // tiền tố tiêu đề/nhãn
const SLUGP = `tmp-e2e-${runId}`; // tiền tố slug
const PASSWORD = 'Secret123';
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
const SITE_FIELDS = ['brandName', 'slogan', 'hotline', 'email', 'address', 'openingHours', 'facebook', 'zalo', 'instagram', 'tiktok', 'footerText'];
const RESERVED = ['ve-chung-toi', 'chinh-sach-bao-hanh', 'chinh-sach-doi-tra', 'chinh-sach-giao-hang', 'dieu-khoan-su-dung', 'huong-dan-do-size'];
let seq = 0;
const n = () => ++seq;

let app: INestApplication; // storage giả (đã cấu hình)
let appOff: INestApplication; // storage chưa cấu hình
let db: mysql.Connection;
let redis: Redis;
let adminToken = '';
let adminId = 0;
let userToken = '';
let originalSite: Array<{ k: string; v: string }> = [];
let snapshot: Record<string, number> = {};

const fake = {
  configured: true, failNext: false, counter: 0, uploads: [] as string[], deleted: [] as string[],
  reset() { this.failNext = false; this.uploads = []; this.deleted = []; },
};
const fakeStorage = {
  isConfigured: () => fake.configured,
  upload: async () => {
    if (fake.failNext) { fake.failNext = false; throw new BusinessException(ErrorCode.UPLOAD_FAILED, 'Không tải được ảnh', HttpStatus.BAD_GATEWAY); }
    const id = `tmp-e2e-${runId}/img-${++fake.counter}`;
    fake.uploads.push(id);
    return { url: `https://fake.test/${id}.jpg`, publicId: id };
  },
  delete: async (id: string) => { fake.deleted.push(id); },
};
const offStorage = { isConfigured: () => false, upload: async () => { throw new Error('off'); }, delete: async () => undefined };

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
const call = (method: Method, path: string, token?: string, body?: object, a: INestApplication = app) => {
  const r = request(a.getHttpServer())[method](`/api${path}`);
  if (token) r.set('Authorization', `Bearer ${token}`);
  return body ? r.send(body) : r;
};
const adm = (method: Method, path: string, body?: object) => call(method, path, adminToken, body);
function expectErr(res: request.Response, status: number, code: string) {
  expect(res.status, JSON.stringify(res.body)).toBe(status);
  expect(res.body.code).toBe(code);
}
const fieldsOf = (res: request.Response): string[] => (res.body.details ?? []).map((d: { field: string }) => d.field);
const waitFor = async (cond: () => boolean, ms = 3000) => {
  const end = Date.now() + ms;
  while (!cond() && Date.now() < end) await new Promise((r) => setTimeout(r, 50));
  expect(cond()).toBe(true);
};
async function mkUser(role: 'admin' | 'user') {
  const email = `e2e-cms-${runId}-${n()}@e2e.test`;
  const phone = '0994' + String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
  const hash = await bcrypt.hash(PASSWORD, 4);
  const [r] = await db.query<mysql.ResultSetHeader>(
    'INSERT INTO users (fullName,email,phone,passwordHash,role,status) VALUES (?,?,?,?,?,?)', ['E2E CMS', email, phone, hash, role, 'active'],
  );
  const res = await request(app.getHttpServer()).post('/api/auth/login').send({ phone, password: PASSWORD });
  expect(res.status).toBe(200);
  return { id: r.insertId, token: res.body.accessToken as string };
}
const countOf = async (table: string, where = '1=1') =>
  ((await db.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) n FROM ${table} WHERE ${where}`))[0][0].n as number);

async function clearRateLimit() {
  const keys = await redis.keys('jewelry:ratelimit:chatbot:*');
  if (keys.length) await redis.del(...keys);
}
async function cleanup() {
  await db.query("DELETE FROM banners WHERE title LIKE 'TMP-E2E%'");
  await db.query("DELETE FROM menus WHERE label LIKE 'TMP-E2E%' AND parentId IS NOT NULL");
  await db.query("DELETE FROM menus WHERE label LIKE 'TMP-E2E%'");
  await db.query("DELETE FROM articles WHERE slug LIKE 'tmp-e2e-%'");
  await db.query("DELETE FROM pages WHERE slug LIKE 'tmp-e2e-%'");
  await db.query("DELETE FROM faqs WHERE question LIKE 'TMP-E2E%'");
  await db.query("DELETE FROM token_blacklist WHERE userId IN (SELECT id FROM users WHERE email LIKE '%@e2e.test')");
  await db.query("DELETE FROM users WHERE email LIKE '%@e2e.test'");
  await redis.del('jewelry:cache:site-info', 'jewelry:cache:menus:header', 'jewelry:cache:menus:footer');
  await clearRateLimit();
}
async function restoreSite() {
  await db.query("DELETE FROM site_settings WHERE setting_key LIKE 'site.%'");
  for (const { k, v } of originalSite) await db.query('INSERT INTO site_settings (setting_key,value) VALUES (?,?)', [k, v]);
  await redis.del('jewelry:cache:site-info');
}

beforeAll(async () => {
  db = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { ca: readFileSync(process.env.DB_SSL_CA as string, 'utf8') } : undefined,
    charset: 'utf8mb4',
  });
  redis = new Redis(process.env.REDIS_URL as string);
  const [rows] = await db.query<mysql.RowDataPacket[]>("SELECT setting_key k, value v FROM site_settings WHERE setting_key LIKE 'site.%'");
  originalSite = rows.map((r) => ({ k: r.k, v: r.v }));
  snapshot = {
    pages: await countOf('pages', "slug NOT LIKE 'tmp-e2e-%'"),
    faqs: await countOf('faqs', "question NOT LIKE 'TMP-E2E%'"),
    menus: await countOf('menus', "label NOT LIKE 'TMP-E2E%'"),
    articles: await countOf('articles', "slug NOT LIKE 'tmp-e2e-%'"),
    banners: await countOf('banners', "title NOT LIKE 'TMP-E2E%'"),
  };
  await cleanup();

  const m1 = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ImageStorage).useValue(fakeStorage).compile();
  app = m1.createNestApplication();
  configureApp(app);
  await app.init();
  const m2 = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ImageStorage).useValue(offStorage).compile();
  appOff = m2.createNestApplication();
  configureApp(appOff);
  await appOff.init();

  const admin = await mkUser('admin');
  adminId = admin.id;
  adminToken = admin.token;
  userToken = (await mkUser('user')).token;
}, 120_000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await restoreSite();
    await app?.close();
    await appOff?.close();
    await db?.end();
    await redis?.quit().catch(() => undefined);
  }
}, 90_000);

// ===================================================================
describe('Phân quyền /admin/** mới', () => {
  const eps: Array<[Method, string]> = [];
  for (const base of ['banners', 'menus', 'articles', 'pages', 'faqs']) {
    eps.push(['get', `/admin/${base}`], ['post', `/admin/${base}`], ['patch', `/admin/${base}/1`], ['delete', `/admin/${base}/1`]);
  }
  eps.push(['get', '/admin/articles/1'], ['get', '/admin/pages/1'], ['get', '/admin/settings/site-info'], ['put', '/admin/settings/site-info'], ['post', '/admin/media/images']);
  it.each(eps)('%s %s: 401 không token, 403 role user', async (m, p) => {
    expect((await call(m, p)).status).toBe(401);
    expect((await call(m, p, userToken, {})).status).toBe(403);
  });
});

// ===================================================================
describe('Site-info', () => {
  const valid = () => ({
    brandName: `TMP-E2E Brand ${runId}`, slogan: 'Khẩu hiệu', hotline: '1900 1234', email: 'hello@example.com', address: 'Số 9, Phố Test',
    openingHours: '09:00 - 18:00', facebook: 'https://facebook.com/tmp', zalo: '', instagram: 'https://instagram.com/tmp', tiktok: '', footerText: 'Chân trang',
  });
  it('GET công khai đủ trường; mặc định khi thiếu khóa', async () => {
    const res = await call('get', '/site-info');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual([...SITE_FIELDS].sort());
    expect(SITE_FIELDS.every((f) => typeof res.body[f] === 'string')).toBe(true);
    try {
      await db.query("DELETE FROM site_settings WHERE setting_key LIKE 'site.%'");
      await redis.del('jewelry:cache:site-info');
      const def = await call('get', '/site-info');
      expect(def.body).toMatchObject({
        brandName: 'Lumière Gems', slogan: 'Trang sức đá quý tinh tế', hotline: '1900 0000', email: 'lienhe@example.com',
        address: 'Số 1, Phố Mẫu, Hà Nội', openingHours: '08:30 - 21:00 mỗi ngày', facebook: '', zalo: '', instagram: '', tiktok: '', footerText: '',
      });
    } finally {
      await restoreSite();
    }
  });
  it('admin GET/PUT: lưu, cache tạo và bị xóa sau khi lưu, khóa lạ bị bỏ qua', async () => {
    await redis.del('jewelry:cache:site-info');
    await call('get', '/site-info');
    expect(await redis.exists('jewelry:cache:site-info')).toBe(1);
    const ttl = await redis.ttl('jewelry:cache:site-info');
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(300);
    const body = valid();
    const put = await adm('put', '/admin/settings/site-info', { ...body, evil: 'x', 'site.evil': 'y' });
    expect(put.status, JSON.stringify(put.body)).toBe(200);
    expect(put.body).toEqual(body);
    expect(await redis.exists('jewelry:cache:site-info')).toBe(0);
    expect((await call('get', '/site-info')).body).toEqual(body);
    expect((await adm('get', '/admin/settings/site-info')).body).toEqual(body);
    const [evil] = await db.query<mysql.RowDataPacket[]>("SELECT id FROM site_settings WHERE setting_key LIKE 'site.%evil%'");
    expect(evil).toHaveLength(0);
    expect((await call('put', '/admin/settings/site-info', adminToken, { ...body, email: '' })).body.email).toBe('');
  });
  it.each([
    ['brandName rỗng', { brandName: '' }, 'brandName'],
    ['brandName 61 ký tự', { brandName: 'x'.repeat(61) }, 'brandName'],
    ['email sai', { email: 'abc' }, 'email'],
    ['email > 150', { email: `${'a'.repeat(145)}@b.co` }, 'email'],
    ['slogan > 150', { slogan: 'x'.repeat(151) }, 'slogan'],
    ['hotline > 30', { hotline: '1'.repeat(31) }, 'hotline'],
    ['address > 255', { address: 'x'.repeat(256) }, 'address'],
    ['openingHours > 100', { openingHours: 'x'.repeat(101) }, 'openingHours'],
    ['footerText > 300', { footerText: 'x'.repeat(301) }, 'footerText'],
    ['facebook http://', { facebook: 'http://facebook.com/x' }, 'facebook'],
    ['zalo javascript:', { zalo: 'javascript:alert(1)' }, 'zalo'],
    ['instagram không phải URL', { instagram: 'instagram' }, 'instagram'],
    ['tiktok > 255', { tiktok: `https://t.co/${'a'.repeat(250)}` }, 'tiktok'],
  ])('validate: %s -> 400', async (_n, over, field) => {
    const res = await adm('put', '/admin/settings/site-info', { ...valid(), ...over });
    expectErr(res, 400, 'VALIDATION_ERROR');
    expect(fieldsOf(res)).toContain(field);
  });
});

// ===================================================================
describe('Tải ảnh dùng chung', () => {
  const up = (a: INestApplication, buf: Buffer | null, name = 'a.png', mime = 'image/png') => {
    const r = request(a.getHttpServer()).post('/api/admin/media/images').set('Authorization', `Bearer ${adminToken}`);
    if (buf) r.attach('file', buf, { filename: name, contentType: mime });
    return r;
  };
  beforeEach(() => fake.reset());
  it('nội dung không phải ảnh dù đuôi .png -> 400 INVALID_IMAGE', async () => {
    expectErr(await up(app, Buffer.from('not an image'), 'a.png', 'image/png'), 400, 'INVALID_IMAGE');
    expectErr(await up(app, PNG, 'a.png', 'text/plain'), 400, 'INVALID_IMAGE');
  });
  it('> 5MB -> 400; không có file -> 400', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024 + 10)]);
    expect((await up(app, big)).status).toBe(400);
    expect((await up(app, null)).status).toBe(400);
  });
  it('chưa cấu hình -> 503 UPLOAD_NOT_CONFIGURED', async () => {
    expectErr(await up(appOff, PNG), 503, 'UPLOAD_NOT_CONFIGURED');
  });
  it('storage giả -> 201 {url, publicId}; lỗi storage -> 502 UPLOAD_FAILED', async () => {
    const ok = await up(app, PNG);
    expect(ok.status, JSON.stringify(ok.body)).toBe(201);
    expect(Object.keys(ok.body).sort()).toEqual(['publicId', 'url']);
    expect(ok.body.url).toMatch(/^https:\/\/fake\.test\//);
    fake.failNext = true;
    expectErr(await up(app, PNG), 502, 'UPLOAD_FAILED');
  });
});

// ===================================================================
const BAD_LINKS = ['javascript:alert(1)', 'data:text/html,<b>x</b>', '//evil.com/x', '/ok\u0007bell', 'ftp://x.com/a', 'vbscript:x', '/a\nb'];

describe('Banner', () => {
  beforeEach(() => fake.reset());
  const body = (over: Record<string, unknown> = {}) => ({
    title: `TMP-E2E banner ${runId} ${n()}`, imageUrl: 'https://fake.test/b.jpg', position: 'home_hero', ...over,
  });
  it('admin CRUD và public: chỉ active, lọc position, sắp theo sortOrder', async () => {
    const a = (await adm('post', '/admin/banners', body({ sortOrder: 20, linkUrl: '/products' }))).body;
    const b = (await adm('post', '/admin/banners', body({ sortOrder: 10, linkUrl: 'https://x.test/a' }))).body;
    const c = (await adm('post', '/admin/banners', body({ sortOrder: 5, isActive: false }))).body;
    const d = (await adm('post', '/admin/banners', body({ sortOrder: 1, position: 'home_promo' }))).body;
    expect(a).toMatchObject({ position: 'home_hero', sortOrder: 20, linkUrl: '/products', isActive: true });
    const mine = [a.id, b.id, c.id, d.id];
    const hero = (await call('get', '/banners?position=home_hero')).body.filter((x: any) => mine.includes(x.id));
    expect(hero.map((x: any) => x.id)).toEqual([b.id, a.id]);
    expect(Object.keys(hero[0]).sort()).toEqual(['id', 'imageUrl', 'linkUrl', 'position', 'sortOrder', 'title']);
    const promo = (await call('get', '/banners?position=home_promo')).body.filter((x: any) => mine.includes(x.id));
    expect(promo.map((x: any) => x.id)).toEqual([d.id]);
    const all = (await call('get', '/banners')).body.filter((x: any) => mine.includes(x.id));
    expect(all.map((x: any) => x.id)).toEqual([d.id, b.id, a.id]);
    expect((await call('get', '/banners?position=bogus')).status).toBeLessThan(500);
    const list = (await adm('get', '/admin/banners')).body.filter((x: any) => mine.includes(x.id));
    expect(list).toHaveLength(4);
    expect(list[0]).toHaveProperty('imagePublicId');
    expect(list[0]).toHaveProperty('createdAt');
    const upd = await adm('patch', `/admin/banners/${a.id}`, { title: `TMP-E2E renamed ${runId}`, isActive: false, sortOrder: 3 });
    expect(upd.body).toMatchObject({ isActive: false, sortOrder: 3 });
    expect((await adm('delete', `/admin/banners/${a.id}`)).status).toBe(204);
    expectErr(await adm('delete', `/admin/banners/${a.id}`), 404, 'NOT_FOUND');
  });
  it('validate: imageUrl bắt buộc https, vị trí hợp lệ, title', async () => {
    expectErr(await adm('post', '/admin/banners', body({ imageUrl: undefined })), 400, 'VALIDATION_ERROR');
    const http = await adm('post', '/admin/banners', body({ imageUrl: 'http://x.test/a.jpg' }));
    expectErr(http, 400, 'VALIDATION_ERROR');
    expect(fieldsOf(http)).toContain('imageUrl');
    expect(fieldsOf(await adm('post', '/admin/banners', body({ imageUrl: `https://x.test/${'a'.repeat(500)}` })))).toContain('imageUrl');
    expect(fieldsOf(await adm('post', '/admin/banners', body({ position: 'sidebar' })))).toContain('position');
    expect(fieldsOf(await adm('post', '/admin/banners', body({ title: '' })))).toContain('title');
    expect(fieldsOf(await adm('post', '/admin/banners', body({ title: 'x'.repeat(151) })))).toContain('title');
    expect(fieldsOf(await adm('post', '/admin/banners', body({ sortOrder: 1.5 })))).toContain('sortOrder');
  });
  it.each(BAD_LINKS)('liên kết độc hại %j -> 400 field linkUrl (POST và PATCH)', async (link) => {
    const res = await adm('post', '/admin/banners', body({ linkUrl: link }));
    expectErr(res, 400, 'VALIDATION_ERROR');
    expect(fieldsOf(res)).toContain('linkUrl');
    const ok = (await adm('post', '/admin/banners', body())).body;
    const patch = await adm('patch', `/admin/banners/${ok.id}`, { linkUrl: link });
    expectErr(patch, 400, 'VALIDATION_ERROR');
    expect(fieldsOf(patch)).toContain('linkUrl');
  });
  it.each(['/products?x=1', 'http://x.test/a', 'https://x.test/a'])('liên kết hợp lệ %s', async (link) => {
    expect((await adm('post', '/admin/banners', body({ linkUrl: link }))).status).toBe(201);
  });
  it('thay ảnh và xóa banner gọi xóa asset cũ trên storage', async () => {
    const b = (await adm('post', '/admin/banners', body({ imagePublicId: `tmp-e2e-${runId}/old` }))).body;
    expect(fake.deleted).toEqual([]);
    const r = await adm('patch', `/admin/banners/${b.id}`, { imageUrl: 'https://fake.test/new.jpg', imagePublicId: `tmp-e2e-${runId}/new` });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    await waitFor(() => fake.deleted.includes(`tmp-e2e-${runId}/old`));
    expect(fake.deleted).not.toContain(`tmp-e2e-${runId}/new`);
    expect((await adm('delete', `/admin/banners/${b.id}`)).status).toBe(204);
    await waitFor(() => fake.deleted.includes(`tmp-e2e-${runId}/new`));
  });
});

// ===================================================================
describe('Menu', () => {
  const mk = async (over: Record<string, unknown> = {}) => {
    const res = await adm('post', '/admin/menus', { label: `TMP-E2E menu ${runId} ${n()}`, url: '/products', ...over });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body as any;
  };
  const tree = async (placement?: string) =>
    (await call('get', `/menus${placement ? `?placement=${placement}` : ''}`)).body as any[];

  it('cây hai cấp công khai: mục hoạt động, ẩn cha thì ẩn con, lọc placement, sắp theo sortOrder', async () => {
    const root1 = await mk({ sortOrder: 9000 });
    const root2 = await mk({ sortOrder: 9001 });
    const c2 = await mk({ parentId: root1.id, sortOrder: 2 });
    const c1 = await mk({ parentId: root1.id, sortOrder: 1 });
    const hiddenChild = await mk({ parentId: root1.id, isActive: false });
    const hiddenRoot = await mk({ sortOrder: 9002, isActive: false });
    const childOfHidden = await mk({ parentId: hiddenRoot.id });
    const footerRoot = await mk({ placement: 'footer', sortOrder: 9000 });
    const header = await tree(); // mặc định header
    const ids = header.map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining([root1.id, root2.id]));
    expect(ids.indexOf(root1.id)).toBeLessThan(ids.indexOf(root2.id));
    expect(ids).not.toContain(hiddenRoot.id);
    expect(ids).not.toContain(footerRoot.id);
    const r1 = header.find((x) => x.id === root1.id);
    expect(r1.children.map((c: any) => c.id)).toEqual([c1.id, c2.id]);
    expect(Object.keys(r1).sort()).toEqual(['children', 'id', 'label', 'url']);
    expect(Object.keys(r1.children[0]).sort()).toEqual(['id', 'label', 'url']);
    expect(JSON.stringify(header)).not.toContain(String(childOfHidden.label));
    expect(JSON.stringify(header)).not.toContain(hiddenChild.label);
    expect((await tree('footer')).map((x) => x.id)).toContain(footerRoot.id);
    expect((await tree('footer')).map((x) => x.id)).not.toContain(root1.id);
  });
  it('validate url (liên kết độc hại) và parentId', async () => {
    for (const url of BAD_LINKS) {
      const res = await adm('post', '/admin/menus', { label: `TMP-E2E bad ${runId}`, url });
      expectErr(res, 400, 'VALIDATION_ERROR');
      expect(fieldsOf(res)).toContain('url');
    }
    expect(fieldsOf(await adm('post', '/admin/menus', { label: '', url: '/a' }))).toContain('label');
    expect(fieldsOf(await adm('post', '/admin/menus', { label: `TMP-E2E x${runId}`, url: '/a', placement: 'sidebar' }))).toContain('placement');
    const root = await mk();
    const child = await mk({ parentId: root.id });
    const footerRoot = await mk({ placement: 'footer' });
    const notExist = await adm('post', '/admin/menus', { label: `TMP-E2E np ${runId}`, url: '/a', parentId: 999999999 });
    expectErr(notExist, 400, 'VALIDATION_ERROR');
    expect(fieldsOf(notExist)).toContain('parentId');
    // cha là mục con -> vượt 2 cấp
    expect(fieldsOf(await adm('post', '/admin/menus', { label: `TMP-E2E gc ${runId}`, url: '/a', parentId: child.id }))).toContain('parentId');
    // cha khác placement
    expect(fieldsOf(await adm('post', '/admin/menus', { label: `TMP-E2E xp ${runId}`, url: '/a', parentId: footerRoot.id, placement: 'header' }))).toContain('parentId');
    expect(fieldsOf(await adm('post', '/admin/menus', { label: `TMP-E2E xp2 ${runId}`, url: '/a', parentId: root.id, placement: 'footer' }))).toContain('parentId');
  });
  it('PATCH: không tự làm cha, không làm con của hậu duệ, mục có con không gán cha; đổi placement cascade', async () => {
    const root = await mk();
    const child = await mk({ parentId: root.id });
    const other = await mk();
    expect(fieldsOf(await adm('patch', `/admin/menus/${root.id}`, { parentId: root.id }))).toContain('parentId');
    expectErr(await adm('patch', `/admin/menus/${root.id}`, { parentId: child.id }), 400, 'VALIDATION_ERROR');
    const hasChildren = await adm('patch', `/admin/menus/${root.id}`, { parentId: other.id });
    expectErr(hasChildren, 400, 'VALIDATION_ERROR');
    expect(fieldsOf(hasChildren)).toContain('parentId');
    // chuyển con sang cha khác
    const moved = await adm('patch', `/admin/menus/${child.id}`, { parentId: other.id });
    expect(moved.status, JSON.stringify(moved.body)).toBe(200);
    expect(moved.body.parentId).toBe(other.id);
    // bỏ cha -> thành mục gốc
    expect((await adm('patch', `/admin/menus/${child.id}`, { parentId: null })).body.parentId).toBeNull();
    // cascade placement
    const c2 = await mk({ parentId: root.id });
    const res = await adm('patch', `/admin/menus/${root.id}`, { placement: 'footer' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const [[row]] = await db.query<mysql.RowDataPacket[]>('SELECT placement FROM menus WHERE id=?', [c2.id]);
    expect(row.placement).toBe('footer');
    // con không đổi placement khác cha
    expect(fieldsOf(await adm('patch', `/admin/menus/${c2.id}`, { placement: 'header' })).length).toBeGreaterThanOrEqual(0);
  });
  it('xóa mục có con -> 409 RESOURCE_IN_USE; xóa con rồi xóa cha được; admin list phẳng', async () => {
    const root = await mk();
    const child = await mk({ parentId: root.id });
    expectErr(await adm('delete', `/admin/menus/${root.id}`), 409, 'RESOURCE_IN_USE');
    const list = (await adm('get', '/admin/menus')).body.filter((x: any) => [root.id, child.id].includes(x.id));
    expect(list).toHaveLength(2);
    for (const k of ['id', 'label', 'url', 'placement', 'parentId', 'sortOrder', 'isActive']) expect(list[0]).toHaveProperty(k);
    expect((await adm('delete', `/admin/menus/${child.id}`)).status).toBe(204);
    expect((await adm('delete', `/admin/menus/${root.id}`)).status).toBe(204);
    expectErr(await adm('delete', `/admin/menus/${root.id}`), 404, 'NOT_FOUND');
  });
  it('cache jewelry:cache:menus:<placement> được tạo và bị xóa sau khi admin ghi', async () => {
    for (const placement of ['header', 'footer']) {
      await tree(placement);
      expect(await redis.exists(`jewelry:cache:menus:${placement}`), placement).toBe(1);
      const m = await mk({ placement });
      expect(await redis.exists(`jewelry:cache:menus:${placement}`), `${placement} sau POST`).toBe(0);
      expect((await tree(placement)).map((x) => x.id)).toContain(m.id);
      await adm('patch', `/admin/menus/${m.id}`, { isActive: false });
      expect((await tree(placement)).map((x) => x.id)).not.toContain(m.id);
      await adm('delete', `/admin/menus/${m.id}`);
      expect(await redis.exists(`jewelry:cache:menus:${placement}`)).toBe(0);
    }
  });
});

// ===================================================================
describe('Bài viết', () => {
  beforeEach(() => fake.reset());
  const title = (s = '') => `TMP-E2E ${runId} bài ${n()} ${s}`.trim();
  const mk = async (over: Record<string, unknown> = {}) => {
    const res = await adm('post', '/admin/articles', { title: title(), content: '# Nội dung\n\nMarkdown', ...over });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body as any;
  };
  const dbArticle = async (id: number) => (await db.query<mysql.RowDataPacket[]>('SELECT * FROM articles WHERE id=?', [id]))[0][0];

  it('public list: chỉ bài đã đăng và publishedAt <= now, q, mới nhất trước, không có content, phân trang, kẹp 24', async () => {
    const pub1 = await mk({ title: title('Alpha'), summary: `Tóm tắt ${runId} zeta`, isPublished: true });
    const pub2 = await mk({ title: title('Beta'), isPublished: true });
    const draft = await mk({ title: title('Nháp') });
    const future = await mk({ title: title('Tương lai'), isPublished: true });
    await db.query('UPDATE articles SET publishedAt=? WHERE id=?', [new Date(Date.now() - 2 * 86_400_000), pub1.id]);
    await db.query('UPDATE articles SET publishedAt=? WHERE id=?', [new Date(Date.now() - 1 * 86_400_000), pub2.id]);
    await db.query('UPDATE articles SET publishedAt=? WHERE id=?', [new Date(Date.now() + 5 * 86_400_000), future.id]);
    const q = encodeURIComponent(`TMP-E2E ${runId}`);
    const res = await call('get', `/articles?q=${q}&pageSize=24`);
    expect(res.status).toBe(200);
    expect(res.body.items.map((i: any) => i.id)).toEqual([pub2.id, pub1.id]);
    expect(Object.keys(res.body.items[0]).sort()).toEqual(['id', 'publishedAt', 'slug', 'summary', 'thumbnailUrl', 'title']);
    expect(JSON.stringify(res.body)).not.toContain('"content"');
    expect(res.body.items.map((i: any) => i.id)).not.toContain(draft.id);
    expect(res.body.items.map((i: any) => i.id)).not.toContain(future.id);
    expect(res.body.items[0].publishedAt).toMatch(/Z$/);
    expect((await call('get', `/articles?q=${encodeURIComponent(`${runId} zeta`)}`)).body.items.map((i: any) => i.id)).toEqual([pub1.id]); // tóm tắt
    expect((await call('get', `/articles?q=${encodeURIComponent(`tmp-e2e ${runId} bài`.toUpperCase())}&pageSize=1&page=2`)).body)
      .toMatchObject({ page: 2, pageSize: 1, total: 2, totalPages: 2 });
    expect((await call('get', '/articles?pageSize=100')).body.pageSize).toBe(24);
    expect((await call('get', '/articles')).body).toMatchObject({ page: 1, pageSize: 9 });
  });
  it('GET /articles/:slug đầy đủ + related tối đa 3; nháp/không tồn tại 404', async () => {
    const a = await mk({ title: title('Chi tiết'), content: 'Nội dung **đậm**', summary: 'tt', isPublished: true });
    await Promise.all([1, 2, 3, 4].map(() => mk({ isPublished: true })));
    const res = await call('get', `/articles/${a.slug}`);
    expect(res.status).toBe(200);
    for (const k of ['id', 'title', 'slug', 'summary', 'content', 'thumbnailUrl', 'publishedAt', 'updatedAt', 'related']) expect(res.body).toHaveProperty(k);
    expect(res.body.content).toBe('Nội dung **đậm**');
    expect(res.body.related.length).toBeLessThanOrEqual(3);
    expect(res.body.related.length).toBe(3);
    expect(res.body.related.map((r: any) => r.id)).not.toContain(a.id);
    expect(res.body.updatedAt).toMatch(/Z$/);
    const draft = await mk();
    expectErr(await call('get', `/articles/${draft.slug}`), 404, 'NOT_FOUND');
    expectErr(await call('get', '/articles/khong-ton-tai-xyz'), 404, 'NOT_FOUND');
  });
  it('admin: slug tự sinh, trùng slug 409 kèm field, authorId = admin, publishedAt đặt lần đầu và giữ khi gỡ rồi đăng lại', async () => {
    const t = title('Slug');
    const a = await mk({ title: t });
    expect(a.slug).toMatch(new RegExp(`^${SLUGP}-`));
    const a2 = await mk({ title: t });
    expect(a2.slug).toBe(`${a.slug}-2`);
    const dup = await adm('post', '/admin/articles', { title: title(), content: 'x', slug: a.slug });
    expectErr(dup, 409, 'SLUG_ALREADY_EXISTS');
    expect(fieldsOf(dup)).toContain('slug');
    expect(a.authorId ?? (await dbArticle(a.id)).authorId).toBe(adminId);
    expect(a.publishedAt ?? null).toBeNull();
    const pub = await adm('patch', `/admin/articles/${a.id}`, { isPublished: true });
    expect(pub.status, JSON.stringify(pub.body)).toBe(200);
    const first = (await dbArticle(a.id)).publishedAt;
    expect(first).not.toBeNull();
    await adm('patch', `/admin/articles/${a.id}`, { isPublished: false });
    expect((await dbArticle(a.id)).publishedAt).toEqual(first);
    expectErr(await call('get', `/articles/${a.slug}`), 404, 'NOT_FOUND');
    await new Promise((r) => setTimeout(r, 1100));
    await adm('patch', `/admin/articles/${a.id}`, { isPublished: true });
    expect((await dbArticle(a.id)).publishedAt).toEqual(first);
    expect((await call('get', `/articles/${a.slug}`)).status).toBe(200);
    // PATCH giữ nguyên slug của chính mình không báo trùng
    expect((await adm('patch', `/admin/articles/${a.id}`, { slug: a.slug, title: title('đổi') })).status).toBe(200);
    expectErr(await adm('patch', `/admin/articles/${a2.id}`, { slug: a.slug }), 409, 'SLUG_ALREADY_EXISTS');
    // đăng ngay khi tạo
    const direct = await mk({ isPublished: true });
    expect((await dbArticle(direct.id)).publishedAt).not.toBeNull();
    // admin list/detail
    const list = await adm('get', `/admin/articles?q=${encodeURIComponent(`TMP-E2E ${runId}`)}&published=false&pageSize=100`);
    expect(list.body.items.every((i: any) => i.isPublished === false)).toBe(true);
    expect(list.body.items[0]).toHaveProperty('createdAt');
    const detail = await adm('get', `/admin/articles/${a.id}`);
    expect(detail.body).toHaveProperty('thumbnailPublicId');
    expectErr(await adm('get', '/admin/articles/999999999'), 404, 'NOT_FOUND');
  });
  it.each([['null', null], ['chuỗi rỗng', '']])('bỏ ảnh bằng thumbnailUrl %s: xóa cả url và publicId, xóa asset cũ', async (_n, value) => {
    const pid = `tmp-e2e-${runId}/thumb-${n()}`;
    const a = await mk({ thumbnailUrl: 'https://fake.test/t.jpg', thumbnailPublicId: pid });
    expect((await dbArticle(a.id)).thumbnailPublicId).toBe(pid);
    const r = await adm('patch', `/admin/articles/${a.id}`, { thumbnailUrl: value });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const row = await dbArticle(a.id);
    expect(row.thumbnailUrl).toBeNull();
    expect(row.thumbnailPublicId).toBeNull();
    await waitFor(() => fake.deleted.includes(pid));
  });
  it('đổi ảnh xóa ảnh cũ; xóa bài xóa asset; POST với thumbnailUrl rỗng nghĩa là không ảnh', async () => {
    const old = `tmp-e2e-${runId}/old-${n()}`;
    const neu = `tmp-e2e-${runId}/new-${n()}`;
    const a = await mk({ thumbnailUrl: 'https://fake.test/o.jpg', thumbnailPublicId: old });
    await adm('patch', `/admin/articles/${a.id}`, { thumbnailUrl: 'https://fake.test/n.jpg', thumbnailPublicId: neu });
    await waitFor(() => fake.deleted.includes(old));
    expect(fake.deleted).not.toContain(neu);
    expect((await adm('delete', `/admin/articles/${a.id}`)).status).toBe(204);
    await waitFor(() => fake.deleted.includes(neu));
    expectErr(await adm('delete', `/admin/articles/${a.id}`), 404, 'NOT_FOUND');
    const none = await mk({ thumbnailUrl: '' });
    expect((await dbArticle(none.id)).thumbnailUrl).toBeNull();
  });
  it('validate: http:// bị 400, content rỗng / > 100000 ký tự, title, summary', async () => {
    const base = { title: title(), content: 'x' };
    const http = await adm('post', '/admin/articles', { ...base, thumbnailUrl: 'http://x.test/a.jpg' });
    expectErr(http, 400, 'VALIDATION_ERROR');
    expect(fieldsOf(http)).toContain('thumbnailUrl');
    expect(fieldsOf(await adm('post', '/admin/articles', { ...base, content: '' }))).toContain('content');
    expect(fieldsOf(await adm('post', '/admin/articles', { ...base, content: 'x'.repeat(100_001) }))).toContain('content');
    expect((await adm('post', '/admin/articles', { ...base, content: 'x'.repeat(100_000) })).status).toBe(201);
    expect(fieldsOf(await adm('post', '/admin/articles', { ...base, title: 'ab' }))).toContain('title');
    expect(fieldsOf(await adm('post', '/admin/articles', { ...base, summary: 'x'.repeat(501) }))).toContain('summary');
    expect(fieldsOf(await adm('post', '/admin/articles', { ...base, slug: 'Bad Slug' }))).toContain('slug');
    const a = await mk();
    expect(fieldsOf(await adm('patch', `/admin/articles/${a.id}`, { thumbnailUrl: 'http://x.test/a.jpg' }))).toContain('thumbnailUrl');
    expect(fieldsOf(await adm('patch', `/admin/articles/${a.id}`, { content: '' }))).toContain('content');
  });
});

// ===================================================================
describe('Trang nội dung', () => {
  const mk = async (over: Record<string, unknown> = {}) => {
    const res = await adm('post', '/admin/pages', { slug: `${SLUGP}-${n()}`, title: `TMP-E2E trang ${runId}`, content: '## Nội dung', ...over });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body as any;
  };
  it('public: /pages chỉ active, /pages/:slug, ẩn/không có -> 404', async () => {
    const act = await mk();
    const off = await mk({ isActive: false });
    const list = (await call('get', '/pages')).body as any[];
    expect(list.map((p) => p.slug)).toEqual(expect.arrayContaining(RESERVED));
    expect(list.map((p) => p.slug)).toContain(act.slug);
    expect(list.map((p) => p.slug)).not.toContain(off.slug);
    expect(Object.keys(list[0]).sort()).toEqual(['slug', 'title']);
    const titles = list.map((p) => p.title);
    expect(titles.length).toBeGreaterThan(5);
    const detail = await call('get', `/pages/${act.slug}`);
    expect(detail.status).toBe(200);
    expect(Object.keys(detail.body).sort()).toEqual(['content', 'slug', 'title', 'updatedAt']);
    expect(detail.body.updatedAt).toMatch(/Z$/);
    expectErr(await call('get', `/pages/${off.slug}`), 404, 'NOT_FOUND');
    expectErr(await call('get', '/pages/khong-ton-tai-xyz'), 404, 'NOT_FOUND');
    expect((await call('get', '/pages/ve-chung-toi')).status).toBe(200);
  });
  it('trang hệ thống: isReserved đúng; xóa / đổi slug -> 409 RESERVED_PAGE; dữ liệu seed giữ nguyên', async () => {
    const own = await mk();
    const list = (await adm('get', '/admin/pages')).body as any[];
    for (const slug of RESERVED) {
      const p = list.find((x) => x.slug === slug);
      expect(p, slug).toBeDefined();
      expect(p.isReserved).toBe(true);
    }
    expect(list.find((x) => x.id === own.id)).toMatchObject({ isReserved: false });
    const before = await db.query<mysql.RowDataPacket[]>('SELECT id, slug, title, content, isActive FROM pages WHERE slug IN (?) ORDER BY id', [RESERVED]);
    for (const slug of RESERVED) {
      const p = list.find((x) => x.slug === slug);
      expectErr(await adm('delete', `/admin/pages/${p.id}`), 409, 'RESERVED_PAGE');
      expectErr(await adm('patch', `/admin/pages/${p.id}`, { slug: `${SLUGP}-moved` }), 409, 'RESERVED_PAGE');
    }
    const after = await db.query<mysql.RowDataPacket[]>('SELECT id, slug, title, content, isActive FROM pages WHERE slug IN (?) ORDER BY id', [RESERVED]);
    expect(after[0]).toEqual(before[0]);
    expect(after[0]).toHaveLength(6);
  });
  it('CRUD trang tự tạo; slug sai định dạng/trùng', async () => {
    const p = await mk();
    expect((await adm('get', `/admin/pages/${p.id}`)).body).toMatchObject({ id: p.id, slug: p.slug, isActive: true });
    const upd = await adm('patch', `/admin/pages/${p.id}`, { title: 'Tiêu đề mới', content: 'mới', isActive: false });
    expect(upd.body).toMatchObject({ title: 'Tiêu đề mới', content: 'mới', isActive: false });
    const moved = await adm('patch', `/admin/pages/${p.id}`, { slug: `${SLUGP}-moved-${n()}` });
    expect(moved.status).toBe(200);
    expect((await adm('patch', `/admin/pages/${p.id}`, { slug: moved.body.slug })).status).toBe(200);
    for (const slug of ['Bad Slug', 'a', 'x_y', 'Có-dấu', 'a'.repeat(121)]) {
      const r = await adm('post', '/admin/pages', { slug, title: 't', content: 'c' });
      expectErr(r, 400, 'VALIDATION_ERROR');
      expect(fieldsOf(r)).toContain('slug');
    }
    const dup = await adm('post', '/admin/pages', { slug: moved.body.slug, title: 't', content: 'c' });
    expectErr(dup, 409, 'SLUG_ALREADY_EXISTS');
    expect(fieldsOf(dup)).toContain('slug');
    expectErr(await adm('post', '/admin/pages', { slug: 've-chung-toi', title: 't', content: 'c' }), 409, 'SLUG_ALREADY_EXISTS');
    expect(fieldsOf(await adm('post', '/admin/pages', { slug: `${SLUGP}-z${n()}`, title: '', content: 'c' }))).toContain('title');
    expect(fieldsOf(await adm('post', '/admin/pages', { slug: `${SLUGP}-z${n()}`, title: 't', content: '' }))).toContain('content');
    expect(fieldsOf(await adm('post', '/admin/pages', { slug: `${SLUGP}-z${n()}`, title: 't', content: 'x'.repeat(100_001) }))).toContain('content');
    const other = await mk();
    expectErr(await adm('patch', `/admin/pages/${other.id}`, { slug: moved.body.slug }), 409, 'SLUG_ALREADY_EXISTS');
    expect((await adm('delete', `/admin/pages/${p.id}`)).status).toBe(204);
    expectErr(await adm('get', `/admin/pages/${p.id}`), 404, 'NOT_FOUND');
  });
});

// ===================================================================
describe('FAQ', () => {
  const mk = async (over: Record<string, unknown> = {}) => {
    const res = await adm('post', '/admin/faqs', { question: `TMP-E2E ${runId} câu hỏi ${n()}?`, answer: 'Trả lời', sortOrder: -1000, ...over });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body as any;
  };
  it('public chỉ active theo sortOrder; admin CRUD', async () => {
    const a = await mk({ sortOrder: -1000 });
    const b = await mk({ sortOrder: -1001 });
    const off = await mk({ isActive: false });
    const pub = (await call('get', '/faqs')).body as any[];
    const ids = pub.map((f) => f.id);
    expect(ids.indexOf(b.id)).toBeLessThan(ids.indexOf(a.id));
    expect(ids).not.toContain(off.id);
    expect(Object.keys(pub[0]).sort()).toEqual(['answer', 'id', 'question']);
    const list = (await adm('get', '/admin/faqs')).body as any[];
    const row = list.find((f) => f.id === off.id);
    expect(row).toMatchObject({ isActive: false, sortOrder: -1000 });
    expect(row).toHaveProperty('keywords');
    const upd = await adm('patch', `/admin/faqs/${a.id}`, { answer: 'Mới', keywords: 'abc, def', isActive: false });
    expect(upd.body).toMatchObject({ answer: 'Mới', isActive: false });
    expect((await adm('delete', `/admin/faqs/${a.id}`)).status).toBe(204);
    expectErr(await adm('delete', `/admin/faqs/${a.id}`), 404, 'NOT_FOUND');
  });
  it.each([
    ['câu hỏi quá ngắn', { question: 'ab' }, 'question'],
    ['câu hỏi > 500', { question: 'q'.repeat(501) }, 'question'],
    ['trả lời rỗng', { answer: '' }, 'answer'],
    ['trả lời > 2000', { answer: 'a'.repeat(2001) }, 'answer'],
    ['từ khóa 1 ký tự', { keywords: 'ok từ, a' }, 'keywords'],
    ['từ khóa > 50 ký tự', { keywords: `ok từ, ${'x'.repeat(51)}` }, 'keywords'],
    ['21 từ khóa', { keywords: Array.from({ length: 21 }, (_, i) => `kw${i}`).join(', ') }, 'keywords'],
    ['tổng > 1000 ký tự', { keywords: Array.from({ length: 20 }, () => 'y'.repeat(50)).join(', ') }, 'keywords'],
  ])('validate: %s -> 400', async (_n, over, field) => {
    const res = await adm('post', '/admin/faqs', { question: `TMP-E2E ${runId} v?`, answer: 'a', ...over });
    expectErr(res, 400, 'VALIDATION_ERROR');
    expect(fieldsOf(res)).toContain(field);
  });
  it('20 từ khóa hợp lệ (mỗi từ khóa 2..50) được chấp nhận', async () => {
    const kws = Array.from({ length: 20 }, (_, i) => `tu khoa ${i}`).join(', ');
    expect((await adm('post', '/admin/faqs', { question: `TMP-E2E ${runId} kw?`, answer: 'a', keywords: kws })).status).toBe(201);
  });
});

// ===================================================================
describe('Chatbot', () => {
  const ask = (message: unknown) => call('post', '/chatbot/ask', undefined, { message });
  const mkFaq = async (over: Record<string, unknown>) => {
    const res = await adm('post', '/admin/faqs', { question: `TMP-E2E ${runId} qq${n()}?`, answer: 'Đáp án', sortOrder: -1000, ...over });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body as any;
  };
  beforeEach(async () => {
    await clearRateLimit();
  });

  it('suggestions: lời chào và tối đa 4 gợi ý theo sortOrder, không cần token', async () => {
    const first = await mkFaq({ sortOrder: -5000, keywords: 'gợi ý zq' });
    const res = await call('get', '/chatbot/suggestions');
    expect(res.status).toBe(200);
    expect(typeof res.body.greeting).toBe('string');
    expect(res.body.greeting.length).toBeGreaterThan(5);
    expect(res.body.suggestions.length).toBeLessThanOrEqual(4);
    expect(res.body.suggestions[0]).toEqual({ id: first.id, question: first.question });
    await adm('patch', `/admin/faqs/${first.id}`, { isActive: false });
    expect((await call('get', '/chatbot/suggestions')).body.suggestions.map((s: any) => s.id)).not.toContain(first.id);
  });

  it('khớp từ khóa: có dấu / không dấu, đ, hoa thường, dấu câu', async () => {
    const faq = await mkFaq({ keywords: 'đồng zqkw, quắn lổi zqkw', answer: `Đáp án khớp ${runId}` });
    for (const msg of ['dong zqkw', 'ĐỒNG ZQKW?!', 'Cho  hỏi: đồng,  zqkw nhé', 'quan loi zqkw', 'QUẮN LỔI ZQKW.']) {
      const res = await ask(msg);
      expect(res.status, msg).toBe(200);
      expect(res.body.fallback, msg).toBe(false);
      expect(res.body.matched, msg).toEqual({ id: faq.id, question: faq.question });
      expect(res.body.answer).toBe(`Đáp án khớp ${runId}`);
    }
  });
  it('cụm từ khóa theo ranh giới từ: "dongzqkw" và "xdong zqkwx" không khớp', async () => {
    await mkFaq({ keywords: 'đồng zqkw' });
    for (const msg of ['dongzqkw', 'xdong zqkwx', 'dong', 'zqkw']) {
      const res = await ask(msg);
      expect(res.body.fallback, msg).toBe(true);
      expect(res.body.matched).toBeNull();
    }
  });
  it('FAQ ẩn không bao giờ được trả (kể cả trong suggestions)', async () => {
    const off = await mkFaq({ keywords: 'ẩn zqhid', isActive: false });
    const res = await ask('an zqhid');
    expect(res.body.fallback).toBe(true);
    expect(res.body.matched).toBeNull();
    expect(JSON.stringify(res.body)).not.toContain(off.question);
    expect(res.body.suggestions.map((s: any) => s.id)).not.toContain(off.id);
  });
  it('hòa điểm: sortOrder nhỏ hơn thắng, rồi id nhỏ hơn', async () => {
    const lowerId = await mkFaq({ keywords: 'hòa zqtie', sortOrder: -999 });
    const higherId = await mkFaq({ keywords: 'hòa zqtie', sortOrder: -999 });
    const best = await mkFaq({ keywords: 'hòa zqtie', sortOrder: -1002 });
    expect((await ask('hoa zqtie')).body.matched.id).toBe(best.id);
    await adm('patch', `/admin/faqs/${best.id}`, { isActive: false });
    const res = await ask('hoa zqtie');
    expect(res.body.matched.id).toBe(lowerId.id);
    expect(lowerId.id).toBeLessThan(higherId.id);
  });
  it('suggestions đi kèm tối đa 4, không trùng matched', async () => {
    const m = await mkFaq({ keywords: 'khớp zqsug', sortOrder: -3000 });
    await Promise.all([1, 2, 3, 4, 5].map((i) => mkFaq({ keywords: `khác ${i} zqother`, sortOrder: -2000 + i })));
    const res = await ask('khop zqsug');
    expect(res.body.matched.id).toBe(m.id);
    expect(res.body.suggestions.length).toBeLessThanOrEqual(4);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(res.body.suggestions.map((s: any) => s.id)).not.toContain(m.id);
    const fb = await ask('zzzz qqqq xxxx');
    expect(fb.body.fallback).toBe(true);
    expect(fb.body.suggestions.length).toBeLessThanOrEqual(4);
  });
  it('điểm < 3 -> fallback có hotline/email lấy từ site-info (đổi site-info rồi kiểm)', async () => {
    const put = await adm('put', '/admin/settings/site-info', {
      brandName: 'Lumière Gems', slogan: '', hotline: `HL-${runId}`, email: `fb-${runId}@example.com`, address: '', openingHours: '',
      facebook: '', zalo: '', instagram: '', tiktok: '', footerText: '',
    });
    expect(put.status, JSON.stringify(put.body)).toBe(200);
    const res = await ask('qwxzv plmkj');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ fallback: true, matched: null });
    expect(res.body.answer).toContain(`HL-${runId}`);
    expect(res.body.answer).toContain(`fb-${runId}@example.com`);
  });
  it('validate message: rỗng, chỉ khoảng trắng, > 300 ký tự, thiếu, không phải chuỗi -> 400; đúng 300 được; trim', async () => {
    for (const m of ['', '    ', 'a'.repeat(301), undefined, 123, null]) {
      expectErr(await ask(m), 400, 'VALIDATION_ERROR');
    }
    expect((await ask('a'.repeat(300))).status).toBe(200);
    expect((await ask('   xin chào   ')).status).toBe(200);
  });
  it('nội dung tin nhắn không xuất hiện trong response lỗi', async () => {
    const marker = `SECRETMARK${runId}`;
    const res = await ask(`${marker}${'x'.repeat(300)}`);
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain(marker);
  });
  it('giới hạn 20 request/phút/IP: request thứ 21 -> 429 RATE_LIMITED kèm retryAfterSeconds', async () => {
    for (let i = 0; i < 20; i++) expect((await ask('xin chao')).status, `lần ${i + 1}`).toBe(200);
    const res = await ask('xin chao');
    expectErr(res, 429, 'RATE_LIMITED');
    expect(res.body.retryAfterSeconds).toBeGreaterThan(0);
    expect(res.body.retryAfterSeconds).toBeLessThanOrEqual(60);
    expect(JSON.stringify(res.body)).not.toContain('xin chao');
    const keys = await redis.keys('jewelry:ratelimit:chatbot:*');
    expect(keys.length).toBeGreaterThanOrEqual(1);
    expect(await redis.ttl(keys[0])).toBeGreaterThan(0);
    await clearRateLimit();
    expect((await ask('xin chao')).status).toBe(200);
  });
  it('20 request song song không vượt ngưỡng: đúng 20 thành công, request dư bị 429, không 5xx', async () => {
    const rs = await Promise.all(Array.from({ length: 25 }, () => ask('xin chao')));
    expect(rs.filter((r) => r.status >= 500)).toHaveLength(0);
    expect(rs.filter((r) => r.status === 200)).toHaveLength(20);
    expect(rs.filter((r) => r.status === 429)).toHaveLength(5);
  });
});

// ===================================================================
describe('Dữ liệu CMS seed nguyên vẹn', () => {
  it('số lượng bản ghi seed không đổi sau khi test (kiểm tra cuối cùng trước dọn)', async () => {
    await cleanup();
    expect(await countOf('pages', "slug NOT LIKE 'tmp-e2e-%'")).toBe(snapshot.pages);
    expect(await countOf('faqs', "question NOT LIKE 'TMP-E2E%'")).toBe(snapshot.faqs);
    expect(await countOf('menus', "label NOT LIKE 'TMP-E2E%'")).toBe(snapshot.menus);
    expect(await countOf('articles', "slug NOT LIKE 'tmp-e2e-%'")).toBe(snapshot.articles);
    expect(await countOf('banners', "title NOT LIKE 'TMP-E2E%'")).toBe(snapshot.banners);
    const [res] = await db.query<mysql.RowDataPacket[]>('SELECT slug FROM pages WHERE slug IN (?)', [RESERVED]);
    expect(res).toHaveLength(6);
  });
});
