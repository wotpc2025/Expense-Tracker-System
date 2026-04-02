# Expense Tracker System

ระบบจัดการรายรับรายจ่ายส่วนบุคคลด้วย Next.js (App Router) ที่เน้นการบริหารงบประมาณ, ติดตามค่าใช้จ่าย, และมีฟีเจอร์ AI ช่วยสแกนใบเสร็จเพื่อเพิ่มรายการได้เร็วขึ้น

## Features

- Authentication ด้วย Clerk
- Dashboard สรุปภาพรวมงบประมาณและค่าใช้จ่าย
- จัดการงบประมาณ: สร้าง, แก้ไข, ลบ, ดูยอดคงเหลือ
- จัดการค่าใช้จ่าย: เพิ่มแบบปกติ, เพิ่มหลายรายการจากผลสแกนใบเสร็จ, ลบรายการ
- สแกนใบเสร็จด้วย AI ผ่าน OpenRouter API
- กำหนดหมวดหมู่รายจ่าย (มีค่าเริ่มต้น + เพิ่มเองได้)
- ตารางแสดงข้อมูลแบบค้นหา/กรอง และปรับความหนาแน่นของการแสดงผลได้
- แสดงกราฟสรุปการใช้จ่าย

## Tech Stack

- Next.js 16 + React 18
- Clerk (Auth)
- Drizzle ORM + PostgreSQL
- Tailwind CSS 4
- Recharts + AG Grid
- Sonner (Toast)

## Project Structure (สำคัญ)

- app/(routes)/dashboard: หน้าหลักหลังล็อกอิน
- app/_actions/dbActions.js: Server Actions สำหรับ CRUD
- app/api/ai/scan-receipt/route.js: API สแกนใบเสร็จด้วย AI
- utils/schema.jsx: โครงสร้างตารางฐานข้อมูล
- utils/dbConfig.jsx: การเชื่อมต่อฐานข้อมูล
- drizzle.config.js: ตั้งค่า Drizzle Kit

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL (local หรือ cloud)
- บัญชี Clerk
- บัญชี OpenRouter (ถ้าต้องการใช้ฟีเจอร์สแกนใบเสร็จ)

## Environment Variables

สร้างไฟล์ .env.local สำหรับรันแบบ local (และสามารถใช้ .env สำหรับ Docker runtime ได้)

ตัวอย่าง:

```env
# Database
NEXT_PUBLIC_DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# AI Receipt Scan (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_MODEL=qwen/qwen2.5-vl-72b-instruct

# App URL (optional, used by OpenRouter headers)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

หมายเหตุ:

- NEXT_PUBLIC_DATABASE_URL ถูกใช้งานทั้งฝั่งแอปและ Drizzle config ในโปรเจกต์นี้
- ถ้าไม่ใส่ OPENROUTER_API_KEY ระบบส่วนอื่นยังทำงานได้ แต่ฟีเจอร์สแกนใบเสร็จจะใช้งานไม่ได้

## Installation (Local)

1. ติดตั้ง dependencies

```bash
npm install
```

2. เตรียมไฟล์ .env.local ตามตัวอย่างด้านบน

3. สร้าง/อัปเดต schema ลงฐานข้อมูล

```bash
npm run db:migrate:types
npm run db:push
```

หมายเหตุ: `db:migrate:types` ใช้สำหรับฐานข้อมูลเดิมที่เคยเก็บ amount/createdAt เป็นข้อความ เพื่อแปลงข้อมูลก่อน push schema ใหม่

4. รันแอปโหมดพัฒนา

```bash
npm run dev
```

5. เปิดใช้งานที่ http://localhost:3000

## Scripts

- npm run dev: รันโหมดพัฒนา
- npm run build: build สำหรับ production
- npm run start: รัน production server
- npm run db:push: push schema ด้วย drizzle-kit
- npm run db:migrate:types: migrate ชนิดคอลัมน์เดิม (text) ไปเป็น numeric/timestamp
- npm run db:studio: เปิด Drizzle Studio
- npm run test: รัน unit tests (Vitest)
- npm run test:watch: รัน tests แบบ watch mode

## Docker

โปรเจกต์มี Dockerfile และ docker-compose.yml พร้อมใช้งาน

### รันด้วย Docker Compose

1. สร้างไฟล์ .env ใน root project และกำหนดค่าตัวแปรที่จำเป็น (อย่างน้อย Clerk และ Database)
2. สั่งรัน:

```bash
docker compose up --build -d
```

3. แอปจะเปิดที่พอร์ต:

- http://localhost:3068

ปิดบริการ:

```bash
docker compose down
```

## Deployment Notes

- มีไฟล์ deploy.sh สำหรับ flow deploy ด้วย Docker (stop, pull, build, up)
- ตรวจสอบค่า environment ให้ครบก่อน deploy โดยเฉพาะ Clerk และ Database
- ถ้าใช้งาน AI scan บน production ต้องตั้งค่า OPENROUTER_API_KEY ด้วย

## Testing

รันทดสอบอัตโนมัติ:

```bash
npm run test
```

ชุดทดสอบตอนนี้ครอบคลุม:

- Utility สำหรับ normalize จำนวนเงินและวันที่

## Known Notes

- metadata ของแอปใน app/layout.js ยังเป็นค่าเริ่มต้น สามารถปรับ title/description เพิ่มได้

## License

This project is for educational and internal use.
