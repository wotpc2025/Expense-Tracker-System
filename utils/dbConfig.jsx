/**
 * dbConfig.jsx — MySQL Connection Pool & Drizzle ORM Instance
 *
 * Creates a single shared mysql2 connection pool for all server-side code
 * (Server Actions in dbActions.js, API route handlers, etc.).
 *
 * Connection source (in priority order):
 *   1. DATABASE_URL env var  — used in production / Docker / CI
 *      Format: mysql://user:password@host:port/database
 *   2. Individual env vars   — used in local development
 *      DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 *
 * Pool config: connectionLimit=10, queue unlimited (queueLimit=0).
 * Drizzle is initialized in 'planetscale' mode for better compatibility
 * with cloud databases (disables foreign-key checks on the session).
 *
 * Usage:
 *   import { db } from '@/utils/dbConfig'
 *   await db.select().from(Budgets)...
 */
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const getMySqlPoolConfig = () => {
  // Prefer DATABASE_URL in production/container setups.
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

  // Fallback for local dev when DATABASE_URL is not provided.
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

// Shared MySQL pool for all server actions and route handlers.
const pool = mysql.createPool(getMySqlPoolConfig());

// Drizzle instance exposes typed tables from schema in planetscale mode.
export const db = drizzle(pool, { schema, mode: 'planetscale' });
