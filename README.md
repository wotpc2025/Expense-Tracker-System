# Expense Management System

ระบบจัดการรายรับรายจ่ายส่วนบุคคลด้วย Next.js (App Router) ที่เน้นการบริหารงบประมาณ, ติดตามค่าใช้จ่าย, และมีฟีเจอร์ AI ช่วยสแกนใบเสร็จเพื่อเพิ่มรายการได้เร็วขึ้น

## Features (Current)

- Authentication ด้วย Clerk (Sign-in / Sign-up)
- Dashboard หลักสำหรับ Budget และ Expense management
- Budget CRUD: สร้าง, แก้ไข, ลบ, ดูยอดใช้จ่าย/ยอดคงเหลือ
- Expense CRUD: เพิ่ม, แก้ไข, ลบ และเพิ่มหลายรายการ (bulk)
- AI Receipt Scan ผ่าน OpenRouter พร้อมแยก line items จากใบเสร็จ (รองรับเฉพาะไฟล์รูปภาพไม่เกิน 5MB)
- Rate limit API สแกนใบเสร็จ (5 requests / 5 นาที / IP) + telemetry
- Reports Dashboard พร้อมตัวกรองวันเวลา, กราฟ และ export เป็น CSV/PDF
- Admin Center (route: /dashboard/admin)
- Monitoring, alert acknowledgement, audit logs, bulk set category / bulk delete
- Admin users summary และ database management view
- Health endpoint ตรวจสอบฐานข้อมูลที่ /api/health/db

## Tech Stack

- Next.js 16 + React 18
- Clerk (Auth)
- Drizzle ORM + MySQL
- Tailwind CSS 4
- AG Grid
- Recharts
- jsPDF + jspdf-autotable (PDF export)
- Sonner (Toast)

## Project Structure (สำคัญ)

- app/(routes)/dashboard: หน้าหลักหลังล็อกอิน
- app/(routes)/dashboard/reports: รายงานและ export
- app/(routes)/dashboard/admin: หน้าผู้ดูแลระบบ
- app/_actions/dbActions.js: Server Actions หลัก (CRUD + Admin)
- app/api/ai/scan-receipt/route.js: API สแกนใบเสร็จด้วย AI
- app/api/health/db/route.js: API health check ฐานข้อมูล
- lib/securityTelemetry.js: rate limit และ telemetry ด้านความปลอดภัย
- lib/adminAccess.js: ตรวจสอบสิทธิ์ admin
- utils/schema.jsx: โครงสร้างตารางฐานข้อมูล
- utils/dbConfig.jsx: การเชื่อมต่อฐานข้อมูล
- drizzle.config.js: ตั้งค่า Drizzle Kit

## Prerequisites

- Node.js 20+
- npm 10+
- MySQL (local หรือ cloud)
- บัญชี Clerk
- บัญชี OpenRouter (ถ้าต้องการใช้ฟีเจอร์สแกนใบเสร็จ)

## Environment Variables

สร้างไฟล์ .env.local สำหรับรันแบบ local (และสามารถใช้ .env สำหรับ Docker runtime ได้)

ตัวอย่าง:

```env
# Database
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DB_NAME
# Alternative DB config (when DATABASE_URL is not used)
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=expense_tracker

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Admin allowlist (server-side)
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# AI Receipt Scan (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_MODEL=qwen/qwen2.5-vl-72b-instruct

# App URL (optional, used by OpenRouter headers)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

หมายเหตุ:

- DATABASE_URL ถูกใช้งานบนเซิร์ฟเวอร์เท่านั้น (ไม่ expose ให้ browser เห็น) สำหรับ Drizzle config
- ไม่ควรตั้งค่า NEXT_PUBLIC_DATABASE_URL
- ถ้าไม่ใส่ OPENROUTER_API_KEY ระบบส่วนอื่นยังทำงานได้ แต่ฟีเจอร์สแกนใบเสร็จจะใช้งานไม่ได้
- ADMIN_EMAILS ใช้สำหรับกำหนดผู้มีสิทธิ์เข้าหน้า /dashboard/admin

## Installation (Local)

1. ติดตั้ง dependencies

```bash
npm install
```

2. เตรียมไฟล์ .env.local ตามตัวอย่างด้านบน

3. สร้าง/อัปเดต schema ลงฐานข้อมูล

```bash
npm run db:push
```

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
- npm run db:studio: เปิด Drizzle Studio
- npm run test: รัน unit tests (Vitest)
- npm run test:watch: รัน tests แบบ watch mode

## Docker

โปรเจกต์มี Dockerfile และ docker-compose.yml พร้อมใช้งาน

### รันด้วย Docker Compose

1. สร้างไฟล์ .env ใน root project และกำหนดค่าตัวแปรที่จำเป็น (อย่างน้อย Clerk, Database และ ADMIN_EMAILS ถ้าจะใช้ admin route)
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
- deploy.sh จะโหลดค่าจากไฟล์ .env ที่ root โปรเจกต์อัตโนมัติ ก่อนเริ่มขั้นตอน deploy
- ตรวจสอบค่า environment ให้ครบก่อน deploy โดยเฉพาะ Clerk, Database และ DISCORD_WEBHOOK_URL
- ถ้าใช้งาน AI scan บน production ต้องตั้งค่า OPENROUTER_API_KEY ด้วย
- production ควรตั้ง NEXT_PUBLIC_APP_URL เป็น https://...

## Operations Runbook (สำหรับส่งต่องาน)

- เอกสารปฏิบัติการแบบละเอียดอยู่ที่ docs/operations-runbook-deployment.md
- ครอบคลุมขั้นตอนก่อน deploy, วิธี deploy มาตรฐาน, การตรวจหลัง deploy, incident playbook และ rollback
- แนะนำให้ผู้รับช่วงงานใหม่อ่านเอกสารนี้ก่อนเข้าถึงเครื่อง production

## API Endpoints (สำคัญ)

- POST /api/ai/scan-receipt: สแกนใบเสร็จด้วย AI (multipart/form-data, field ชื่อ `receipt`, ต้อง login, จำกัดขนาดไฟล์ 5MB, มี rate limit)
- GET /api/health/db: เช็กสถานะการเชื่อมต่อฐานข้อมูล

## Testing

รันทดสอบอัตโนมัติ:

```bash
npm run test
```

ชุดทดสอบตอนนี้ครอบคลุม:

- Utility สำหรับ normalize จำนวนเงินและวันที่

สรุปล่าสุดอยู่ที่ไฟล์ TEST_RESULTS.md (6/6 tests passed)

## Known Notes

- metadata ของแอปใน app/layout.js ยังเป็นค่าเริ่มต้น สามารถปรับ title/description เพิ่มได้
- deploy.sh อ่าน Discord webhook จาก .env ผ่านตัวแปร DISCORD_WEBHOOK_URL และดึงชื่อโปรเจกต์จากชื่อ repository ใน git อัตโนมัติ

## License

This project is for educational and internal use.
