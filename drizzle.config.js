import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// สั่งให้โหลดค่าจากไฟล์ .env.local
dotenv.config({
  path: ".env.local",
});

export default defineConfig({
  // 1. ระบุประเภทฐานข้อมูล
  dialect: "mysql", 

  // 2. พาธไปที่ไฟล์ schema
  schema: "./utils/schema.jsx", 

  // 3. โฟลเดอร์ที่จะให้เก็บไฟล์ Migration
  out: "./drizzle",

  // 4. ข้อมูลการเชื่อมต่อ
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'expense_tracker',
  },
});