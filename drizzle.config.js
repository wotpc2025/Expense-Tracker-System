import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// สั่งให้โหลดค่าจากไฟล์ .env.local
dotenv.config({
  path: ".env.local",
});

const getDbCredentials = () => {
  const databaseUrl = String(process.env.DATABASE_URL || '').trim();

  if (databaseUrl) {
    const parsedUrl = new URL(databaseUrl);

    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port ? Number(parsedUrl.port) : 3306,
      user: decodeURIComponent(parsedUrl.username || ''),
      password: decodeURIComponent(parsedUrl.password || ''),
      database: parsedUrl.pathname.replace(/^\//, ''),
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'expense_tracker',
  };
};

export default defineConfig({
  // 1. ระบุประเภทฐานข้อมูล
  dialect: "mysql", 

  // 2. พาธไปที่ไฟล์ schema
  schema: "./utils/schema.jsx", 

  // 3. โฟลเดอร์ที่จะให้เก็บไฟล์ Migration
  out: "./drizzle",

  // 4. ข้อมูลการเชื่อมต่อ
  dbCredentials: getDbCredentials(),
});