import 'dotenv/config';
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';

const provinces = JSON.parse(
  readFileSync(new URL('./data/vn-provinces.json', import.meta.url), 'utf8'),
);

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

try {
  await connection.beginTransaction();

  await connection.query(
    'INSERT INTO provinces (code, name) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name)',
    [provinces.map((p) => [p.code, p.name])],
  );

  const [rows] = await connection.query('SELECT id, code FROM provinces');
  const provinceIdByCode = new Map(rows.map((r) => [r.code, r.id]));

  const wards = provinces.flatMap((p) =>
    p.wards.map((w) => [w.code, w.name, provinceIdByCode.get(p.code)]),
  );
  const chunkSize = 1000;
  for (let i = 0; i < wards.length; i += chunkSize) {
    await connection.query(
      'INSERT INTO wards (code, name, provinceId) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name), provinceId = VALUES(provinceId)',
      [wards.slice(i, i + chunkSize)],
    );
  }

  await connection.commit();

  const [[{ p }]] = await connection.query('SELECT COUNT(*) AS p FROM provinces');
  const [[{ w }]] = await connection.query('SELECT COUNT(*) AS w FROM wards');
  console.log(`Done: ${p} provinces, ${w} wards`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
