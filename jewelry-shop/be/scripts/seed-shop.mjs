import 'dotenv/config';
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';

/**
 * Nạp / gỡ dữ liệu mẫu cửa hàng: phương thức vận chuyển và thông tin chuyển khoản MẪU.
 *   node scripts/seed-shop.mjs            nạp (chỉ chèn nếu chưa có, không đè giá trị admin đã sửa)
 *   node scripts/seed-shop.mjs --remove   xóa phương thức vận chuyển mẫu chưa có đơn
 */
const SHIPPING_METHODS = [
  { name: 'Giao hàng tiêu chuẩn', description: 'Giao trong 2-4 ngày làm việc', fee: 30000 },
  { name: 'Giao hàng nhanh', description: 'Giao trong 24 giờ tại nội thành', fee: 60000 },
];
const BANK_SETTINGS = {
  'bank.bankName': 'Ngân hàng MẪU - đổi trong Cài đặt',
  'bank.accountNumber': '0123456789',
  'bank.accountHolder': 'CONG TY LUMIERE GEMS (MAU)',
  'bank.transferNote': '{orderCode}',
};
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

try {
  await connection.beginTransaction();
  if (remove) {
    let removed = 0;
    let kept = 0;
    for (const method of SHIPPING_METHODS) {
      const [rows] = await connection.query('SELECT id FROM shipping_methods WHERE name = ?', [method.name]);
      for (const { id } of rows) {
        const [[{ n }]] = await connection.query('SELECT COUNT(*) AS n FROM orders WHERE shippingMethodId = ?', [id]);
        if (Number(n) === 0) {
          await connection.query('DELETE FROM shipping_methods WHERE id = ?', [id]);
          removed += 1;
        } else {
          kept += 1;
        }
      }
    }
    console.log(`Removed ${removed} shipping methods (kept ${kept} that have orders)`);
  } else {
    let added = 0;
    for (const method of SHIPPING_METHODS) {
      const [[{ n }]] = await connection.query('SELECT COUNT(*) AS n FROM shipping_methods WHERE name = ?', [method.name]);
      if (Number(n) === 0) {
        await connection.query('INSERT INTO shipping_methods (name, description, fee, isActive) VALUES (?, ?, ?, 1)', [
          method.name,
          method.description,
          method.fee,
        ]);
        added += 1;
      }
    }
    // INSERT IGNORE theo khóa unique setting_key: không đè giá trị admin đã sửa.
    const [result] = await connection.query('INSERT IGNORE INTO site_settings (setting_key, value) VALUES ?', [
      Object.entries(BANK_SETTINGS),
    ]);
    console.log(`Seeded: ${added} shipping methods added, ${result.affectedRows} bank settings added`);
  }
  await connection.commit();
  const [[counts]] = await connection.query(
    `SELECT (SELECT COUNT(*) FROM shipping_methods) AS shippingMethods,
            (SELECT COUNT(*) FROM site_settings WHERE setting_key LIKE 'bank.%') AS bankSettings`,
  );
  console.log('Now in DB:', counts);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
