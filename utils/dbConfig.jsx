
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const getMySqlPoolConfig = () => {
  const databaseUrl = String(process.env.DATABASE_URL || '').trim();

  if (databaseUrl) {
    const parsedUrl = new URL(databaseUrl);

    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port ? Number(parsedUrl.port) : 3306,
      user: decodeURIComponent(parsedUrl.username || ''),
      password: decodeURIComponent(parsedUrl.password || ''),
      database: parsedUrl.pathname.replace(/^\//, ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'expense_tracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
};

// Create MySQL connection pool
const pool = mysql.createPool(getMySqlPoolConfig());

export const db = drizzle(pool, { schema, mode: 'planetscale' });