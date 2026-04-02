
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Prefer server-only DATABASE_URL; fallback keeps existing local setups working.
const connectionString = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL;

if (!connectionString) {
	throw new Error('Missing database connection string. Set DATABASE_URL in environment.');
}

// สำหรับการเชื่อมต่อในแบบ Single Client (เหมาะกับ Next.js Development)
const client = postgres(connectionString);
export const db = drizzle(client, { schema });