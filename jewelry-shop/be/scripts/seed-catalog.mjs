import 'dotenv/config';
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';

/**
 * Nạp / gỡ dữ liệu mẫu danh mục + sản phẩm (mã DEMO-xxx).
 *   node scripts/seed-catalog.mjs            nạp (chạy lại không trùng)
 *   node scripts/seed-catalog.mjs --remove   gỡ đúng dữ liệu mẫu
 * Danh mục/chất liệu/loại đá/bộ sưu tập chỉ được gỡ khi không còn sản phẩm nào dùng.
 */
const data = JSON.parse(readFileSync(new URL('./data/catalog-sample.json', import.meta.url), 'utf8'));
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

const materialNameOf = (product) => {
  switch (product.metal) {
    case 'vang':
      return product.karat ? `Vàng ${product.karat}` : null;
    case 'vang-trang':
      return 'Vàng trắng';
    case 'vang-hong':
      return 'Vàng hồng';
    case 'bac':
      return 'Bạc';
    case 'bach-kim':
      return 'Bạch kim';
    default:
      return null;
  }
};

/** Chia tổng tồn kho đều cho các biến thể, phần dư vào biến thể đầu. */
const splitStock = (total, count) =>
  Array.from({ length: count }, (_, i) => Math.floor(total / count) + (i === 0 ? total % count : 0));

async function idMap(table, column) {
  const [rows] = await connection.query(`SELECT id, ${column} AS k FROM ${table}`);
  return new Map(rows.map((row) => [row.k, row.id]));
}

async function seed() {
  for (const c of data.categories) {
    await connection.query(
      'INSERT INTO categories (name, slug, sortOrder, isActive) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE id = id',
      [c.name, c.slug, c.sortOrder],
    );
  }
  for (const name of data.materials) {
    await connection.query('INSERT INTO materials (name, isActive) VALUES (?, 1) ON DUPLICATE KEY UPDATE id = id', [name]);
  }
  for (const name of data.gemstones) {
    await connection.query('INSERT INTO gemstones (name, isActive) VALUES (?, 1) ON DUPLICATE KEY UPDATE id = id', [name]);
  }
  for (const c of data.collections) {
    await connection.query(
      'INSERT INTO collections (name, slug, description, isActive) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE id = id',
      [c.name, c.slug, c.description],
    );
  }

  const categoryId = await idMap('categories', 'slug');
  const materialId = await idMap('materials', 'name');
  const gemstoneId = await idMap('gemstones', 'name');
  const collectionId = await idMap('collections', 'slug');

  let variantCount = 0;
  for (const p of data.products) {
    const materialName = materialNameOf(p);
    await connection.query(
      `INSERT INTO products (code, name, slug, description, categoryId, materialId, collectionId, targetGroup, weight,
                             costPrice, price, isFeatured, isActive, soldCount, avgRating, reviewCount, createdAt)
       /* avgRating/reviewCount luôn 0 khi tạo và KHÔNG bị ghi đè: điểm đánh giá thuộc về dữ liệu đánh giá thật. */
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1, ?, 0, 0, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), categoryId = VALUES(categoryId),
         materialId = VALUES(materialId), collectionId = VALUES(collectionId), targetGroup = VALUES(targetGroup),
         weight = VALUES(weight), price = VALUES(price), isFeatured = VALUES(isFeatured)`,
      [
        p.code, p.name, p.slug, p.description, categoryId.get(p.category),
        materialName ? (materialId.get(materialName) ?? null) : null,
        p.collection ? (collectionId.get(p.collection) ?? null) : null,
        p.targetGroup, p.weightGram, p.price, p.sold >= 100 || p.rating >= 4.9 ? 1 : 0,
        p.sold, `${p.createdAt} 10:00:00`,
      ],
    );
    const [[{ id: productId }]] = await connection.query('SELECT id FROM products WHERE code = ?', [p.code]);

    const sizes = p.sizes.length ? p.sizes : [''];
    const stocks = splitStock(p.stock, sizes.length);
    for (const [i, size] of sizes.entries()) {
      await connection.query(
        `INSERT INTO product_variants (productId, sku, size, stock, isActive, version) VALUES (?, ?, ?, ?, 1, 1)
         ON DUPLICATE KEY UPDATE id = id`,
        [productId, size ? `${p.code}-${size}` : p.code, size, stocks[i]],
      );
      variantCount += 1;
    }

    // Khuyến mại mẫu: tạo một lần (không đổi ngày nếu đã có); hiệu lực từ hôm qua đến +365 ngày.
    if (p.discountPercent) {
      const name = `DEMO Giảm ${p.discountPercent}% ${p.name}`.slice(0, 150);
      const [[{ n }]] = await connection.query('SELECT COUNT(*) AS n FROM promotions WHERE productId = ? AND name = ?', [productId, name]);
      if (Number(n) === 0) {
        const day = 24 * 60 * 60 * 1000;
        await connection.query(
          'INSERT INTO promotions (name, productId, discountPercent, startsAt, endsAt, isActive) VALUES (?, ?, ?, ?, ?, 1)',
          [name, productId, p.discountPercent, new Date(Date.now() - day), new Date(Date.now() + 365 * day)],
        );
      }
    }

    // Đá quý: chỉ thêm khi sản phẩm chưa có (giữ nguyên chỉnh sửa của admin).
    if (p.gemstone && gemstoneId.has(p.gemstone.type)) {
      const [[{ n }]] = await connection.query('SELECT COUNT(*) AS n FROM product_gemstones WHERE productId = ?', [productId]);
      if (Number(n) === 0) {
        await connection.query(
          `INSERT INTO product_gemstones (productId, gemstoneId, quantity, carat, color, clarity, cut)
           VALUES (?, ?, 1, ?, ?, ?, ?)`,
          [productId, gemstoneId.get(p.gemstone.type), p.gemstone.carat || null, p.gemstone.color, p.gemstone.clarity, p.gemstone.cut],
        );
      }
    }
  }
  return variantCount;
}

async function removeSeed() {
  const [demo] = await connection.query("SELECT id FROM products WHERE code LIKE 'DEMO-%'");
  const ids = demo.map((row) => row.id);
  if (ids.length) {
    const [[{ n }]] = await connection.query(
      'SELECT COUNT(*) AS n FROM order_items oi JOIN product_variants v ON v.id = oi.variantId WHERE v.productId IN (?)',
      [ids],
    );
    if (Number(n) > 0) throw new Error('Có sản phẩm DEMO đã nằm trong đơn hàng, không gỡ được. Hãy ẩn chúng thay vì xóa.');
    await connection.query('DELETE FROM cart_items WHERE variantId IN (SELECT id FROM product_variants WHERE productId IN (?))', [ids]);
    for (const table of ['reviews', 'wishlists', 'promotions', 'product_gemstones', 'product_images', 'product_variants']) {
      await connection.query(`DELETE FROM ${table} WHERE productId IN (?)`, [ids]);
    }
    await connection.query('DELETE FROM products WHERE id IN (?)', [ids]);
  }

  await connection.query("DELETE FROM promotions WHERE name LIKE 'DEMO %'");

  const dropIfUnused = async (table, column, values, usage) => {
    const [rows] = await connection.query(`SELECT id FROM ${table} WHERE ${column} IN (?)`, [values]);
    let removed = 0;
    for (const { id } of rows) {
      const [[{ n }]] = await connection.query(`SELECT COUNT(*) AS n FROM ${usage.table} WHERE ${usage.column} = ?`, [id]);
      if (Number(n) === 0) {
        await connection.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        removed += 1;
      }
    }
    return removed;
  };
  const [cats] = await connection.query('SELECT id, slug FROM categories WHERE slug IN (?)', [data.categories.map((c) => c.slug)]);
  let removedCategories = 0;
  for (const { id } of cats) {
    const [[{ n }]] = await connection.query(
      'SELECT (SELECT COUNT(*) FROM products WHERE categoryId = ?) + (SELECT COUNT(*) FROM categories WHERE parentId = ?) AS n',
      [id, id],
    );
    if (Number(n) === 0) {
      await connection.query('DELETE FROM categories WHERE id = ?', [id]);
      removedCategories += 1;
    }
  }
  const removedMaterials = await dropIfUnused('materials', 'name', data.materials, { table: 'products', column: 'materialId' });
  const removedGemstones = await dropIfUnused('gemstones', 'name', data.gemstones, { table: 'product_gemstones', column: 'gemstoneId' });
  const removedCollections = await dropIfUnused('collections', 'slug', data.collections.map((c) => c.slug), {
    table: 'products',
    column: 'collectionId',
  });
  return { products: ids.length, removedCategories, removedMaterials, removedGemstones, removedCollections };
}

try {
  await connection.beginTransaction();
  if (remove) {
    console.log('Removed:', await removeSeed());
  } else {
    const variants = await seed();
    console.log(`Seeded: ${data.products.length} products, ${variants} variants`);
  }
  await connection.commit();
  const [[counts]] = await connection.query(
    `SELECT (SELECT COUNT(*) FROM products WHERE code LIKE 'DEMO-%') AS demoProducts,
            (SELECT COUNT(*) FROM categories) AS categories, (SELECT COUNT(*) FROM materials) AS materials,
            (SELECT COUNT(*) FROM gemstones) AS gemstones, (SELECT COUNT(*) FROM collections) AS collections`,
  );
  console.log('Now in DB:', counts);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
