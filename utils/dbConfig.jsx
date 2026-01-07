import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// ใช้ DATABASE_URL จาก .env 
const connectionString = process.env.NEXT_PUBLIC_DATABASE_URL;

// สำหรับการเชื่อมต่อในแบบ Single Client (เหมาะกับ Next.js Development)
const client = postgres(connectionString);
export const db = drizzle(client, { schema });