import 'dotenv/config';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const [phone, rawEmail, password, fullName = 'Quản trị viên'] = process.argv.slice(2);

if (!phone || !rawEmail || !password) {
  console.error('Usage: npm run seed:admin -- <phone> <email> <password> [fullName]');
  process.exit(1);
}
const email = rawEmail.trim().toLowerCase();
if (!/^0\d{9}$/.test(phone)) {
  console.error('Phone must be 10 digits starting with 0');
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Invalid email');
  process.exit(1);
}
if (password.length < 6) {
  console.error('Password must be at least 6 characters');
  process.exit(1);
}

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
  const passwordHash = await bcrypt.hash(password, 10);
  await connection.beginTransaction();

  const [rows] = await connection.query('SELECT id, phone, email FROM users WHERE phone = ? OR email = ? FOR UPDATE', [
    phone,
    email,
  ]);
  if (rows.length > 1) {
    throw new Error('Phone and email belong to two different accounts; resolve manually');
  }

  if (rows.length === 1) {
    await connection.query(
      "UPDATE users SET fullName = ?, email = ?, phone = ?, passwordHash = ?, role = 'admin', status = 'active' WHERE id = ?",
      [fullName, email, phone, passwordHash, rows[0].id],
    );
    console.log(`Updated existing account id=${rows[0].id} to admin`);
  } else {
    const [result] = await connection.query(
      "INSERT INTO users (fullName, email, phone, passwordHash, role, status) VALUES (?, ?, ?, ?, 'admin', 'active')",
      [fullName, email, phone, passwordHash],
    );
    console.log(`Created admin id=${result.insertId}`);
  }
  await connection.commit();
} catch (error) {
  await connection.rollback();
  console.error(`Seed admin failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await connection.end();
}
