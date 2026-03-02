import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// สั่งให้โหลดค่าจากไฟล์ .env.local
dotenv.config({
  path: ".env.local",
});

export default defineConfig({
  // 1. ระบุประเภทฐานข้อมูล (ในคลิปรุ่นเก่าไม่ต้องใส่ส่วนนี้)
  dialect: "postgresql", 

  // 2. พาธไปที่ไฟล์ schema (ปรับให้ตรงกับโฟลเดอร์ในโปรเจกต์คุณ)
  schema: "./utils/schema.jsx", 

  // 3. โฟลเดอร์ที่จะให้เก็บไฟล์ Migration
  out: "./drizzle",

  // 4. ข้อมูลการเชื่อมต่อ (ใช้ตัวแปรจาก .env.local)
  dbCredentials: {
    url: process.env.NEXT_PUBLIC_DATABASE_URL, 
  },
});