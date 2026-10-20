import 'dotenv/config';
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';
import {
  SAMPLE_ARTICLES,
  SAMPLE_FAQS,
  SAMPLE_FOOTER_MENU,
  SAMPLE_MARKER,
  SAMPLE_PAGES,
  SITE_DEFAULTS,
} from './data/cms-sample.mjs';

/**
 * Nạp / gỡ dữ liệu mẫu CMS.
 *   node scripts/seed-cms.mjs            nạp (idempotent, không đè nội dung admin đã sửa)
 *   node scripts/seed-cms.mjs --remove   gỡ phần mẫu còn nguyên
 *
 * Cách nhận diện bản ghi mẫu khi --remove:
 *  - bài viết: slug bắt đầu bằng "demo-";
 *  - trang hệ thống: đúng slug mẫu VÀ nội dung vẫn bắt đầu bằng dòng "Nội dung mẫu..." (admin sửa nội dung là mất dấu);
 *  - FAQ: đúng câu hỏi mẫu VÀ đúng câu trả lời mẫu;
 *  - menu: đúng bộ (vị trí, nhãn, đường dẫn, mục cha) như mẫu, không có mục con do admin thêm;
 *  - site.*: khóa có giá trị đúng bằng giá trị mặc định mẫu.
 * Không nạp banner (chưa có ảnh).
 */
const remove = process.argv.includes('--remove');

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { ca: readFileSync(process.env.DB_SSL_CA, 'utf8') } : undefined,
  charset: 'utf8mb4',
  timezone: 'Z',
});

const pageContent = (body) => `${SAMPLE_MARKER}\n\n${body}`;

/** Mục menu mẫu; con của "Trang sức" lấy từ danh mục đang có trong DB để luôn trỏ đúng slug thật. */
async function buildHeaderMenu() {
  const [categories] = await connection.query(
    'SELECT slug, name FROM categories WHERE isActive = 1 AND parentId IS NULL ORDER BY sortOrder ASC, name ASC, id ASC',
  );
  const jewelry = categories.filter((c) => c.slug !== 'da-quy');
  const hasGemstone = categories.some((c) => c.slug === 'da-quy');
  return [
    { label: 'Trang chủ', url: '/' },
    {
      label: 'Trang sức',
      url: '/products',
      children: jewelry.map((c) => ({ label: c.name, url: `/products?category=${c.slug}` })),
    },
    ...(hasGemstone ? [{ label: 'Đá quý', url: '/products?category=da-quy' }] : []),
    { label: 'Bộ sưu tập', url: '/products' },
    { label: 'Khuyến mại', url: '/products?onSale=true' },
    { label: 'Cẩm nang', url: '/articles' },
  ];
}

async function findMenu(placement, label, url, parentId) {
  const [rows] = await connection.query(
    'SELECT id FROM menus WHERE placement = ? AND label = ? AND url = ? AND parentId <=> ? LIMIT 1',
    [placement, label, url, parentId],
  );
  return rows[0]?.id ?? null;
}

async function ensureMenu(placement, item, parentId, sortOrder) {
  const existing = await findMenu(placement, item.label, item.url, parentId);
  if (existing) return { id: existing, created: false };
  const [result] = await connection.query(
    'INSERT INTO menus (label, url, parentId, placement, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, 1)',
    [item.label, item.url, parentId, placement, sortOrder],
  );
  return { id: result.insertId, created: true };
}

async function seed() {
  const stats = { pages: 0, faqs: 0, articles: 0, menus: 0, settings: 0 };

  for (const page of SAMPLE_PAGES) {
    const [result] = await connection.query(
      'INSERT IGNORE INTO pages (slug, title, content, isActive) VALUES (?, ?, ?, 1)',
      [page.slug, page.title, pageContent(page.body)],
    );
    stats.pages += result.affectedRows;
  }

  for (const [index, faq] of SAMPLE_FAQS.entries()) {
    const [[{ n }]] = await connection.query('SELECT COUNT(*) AS n FROM faqs WHERE question = ?', [faq.question]);
    if (Number(n) === 0) {
      await connection.query('INSERT INTO faqs (question, answer, keywords, sortOrder, isActive) VALUES (?, ?, ?, ?, 1)', [
        faq.question,
        faq.answer,
        faq.keywords,
        (index + 1) * 10,
      ]);
      stats.faqs += 1;
    }
  }

  for (const article of SAMPLE_ARTICLES) {
    const [result] = await connection.query(
      `INSERT IGNORE INTO articles (title, slug, summary, content, isPublished, publishedAt)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [article.title, article.slug, article.summary, article.content, new Date()],
    );
    stats.articles += result.affectedRows;
  }

  const header = await buildHeaderMenu();
  for (const [index, item] of header.entries()) {
    const root = await ensureMenu('header', item, null, (index + 1) * 10);
    if (root.created) stats.menus += 1;
    for (const [childIndex, child] of (item.children ?? []).entries()) {
      const created = await ensureMenu('header', child, root.id, (childIndex + 1) * 10);
      if (created.created) stats.menus += 1;
    }
  }
  for (const [index, item] of SAMPLE_FOOTER_MENU.entries()) {
    const created = await ensureMenu('footer', item, null, (index + 1) * 10);
    if (created.created) stats.menus += 1;
  }

  // Chỉ chèn khi khóa chưa có: không đè giá trị admin đã sửa.
  const [settings] = await connection.query('INSERT IGNORE INTO site_settings (setting_key, value) VALUES ?', [
    Object.entries(SITE_DEFAULTS),
  ]);
  stats.settings = settings.affectedRows;
  return stats;
}

async function removeSeed() {
  const stats = { pages: 0, faqs: 0, articles: 0, menus: 0, settings: 0 };

  const [articles] = await connection.query("DELETE FROM articles WHERE slug LIKE 'demo-%'");
  stats.articles = articles.affectedRows;

  for (const page of SAMPLE_PAGES) {
    const [result] = await connection.query('DELETE FROM pages WHERE slug = ? AND content LIKE ?', [
      page.slug,
      `${SAMPLE_MARKER}%`,
    ]);
    stats.pages += result.affectedRows;
  }

  for (const faq of SAMPLE_FAQS) {
    const [result] = await connection.query('DELETE FROM faqs WHERE question = ? AND answer = ?', [faq.question, faq.answer]);
    stats.faqs += result.affectedRows;
  }

  // Menu: xóa mục con trước, rồi mục gốc nếu không còn con nào (con do admin thêm giữ nguyên cha).
  const header = await buildHeaderMenu();
  const plan = [
    ...header.map((item) => ({ placement: 'header', item })),
    ...SAMPLE_FOOTER_MENU.map((item) => ({ placement: 'footer', item })),
  ];
  for (const { placement, item } of plan) {
    const rootId = await findMenu(placement, item.label, item.url, null);
    if (!rootId) continue;
    for (const child of item.children ?? []) {
      const childId = await findMenu(placement, child.label, child.url, rootId);
      if (childId) {
        const [result] = await connection.query('DELETE FROM menus WHERE id = ?', [childId]);
        stats.menus += result.affectedRows;
      }
    }
    const [[{ n }]] = await connection.query('SELECT COUNT(*) AS n FROM menus WHERE parentId = ?', [rootId]);
    if (Number(n) === 0) {
      const [result] = await connection.query('DELETE FROM menus WHERE id = ?', [rootId]);
      stats.menus += result.affectedRows;
    }
  }

  for (const [key, value] of Object.entries(SITE_DEFAULTS)) {
    const [result] = await connection.query('DELETE FROM site_settings WHERE setting_key = ? AND value = ?', [key, value]);
    stats.settings += result.affectedRows;
  }
  return stats;
}

try {
  await connection.beginTransaction();
  const stats = remove ? await removeSeed() : await seed();
  await connection.commit();
  console.log(remove ? 'Removed:' : 'Seeded (new rows):', stats);
  const [[counts]] = await connection.query(
    `SELECT (SELECT COUNT(*) FROM pages) AS pages, (SELECT COUNT(*) FROM faqs) AS faqs,
            (SELECT COUNT(*) FROM articles) AS articles, (SELECT COUNT(*) FROM menus) AS menus,
            (SELECT COUNT(*) FROM site_settings WHERE setting_key LIKE 'site.%') AS siteSettings`,
  );
  console.log('Now in DB:', counts);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
