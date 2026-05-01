# Operations Runbook - Deployment (Expense Tracker)

เอกสารนี้ใช้สำหรับส่งต่องานเชิงปฏิบัติการ (operation) ให้ทีมใหม่สามารถ deploy, ตรวจสอบระบบ, แก้ปัญหาเบื้องต้น, และ rollback ได้อย่างเป็นขั้นตอน

## 1) Purpose และ Scope

- ใช้กับการ deploy แอป Expense Tracker ผ่าน Docker Compose
- อ้างอิงสคริปต์หลัก: deploy.sh
- เหมาะกับเครื่องปลายทางที่มี Docker + Git และมีไฟล์ .env พร้อมใช้งาน

## 2) Owner และช่องทางแจ้งเตือน

- Deployment owner: ผู้ดูแลระบบ/DevOps ประจำทีม
- ช่องทางแจ้งผล: Discord Webhook (ผ่านตัวแปร DISCORD_WEBHOOK_URL)
- ชื่อโปรเจกต์ในแจ้งเตือน: ดึงอัตโนมัติจากชื่อ repository ใน git

## 3) Architecture Snapshot (เชิงปฏิบัติการ)

- รันเป็น 1 service หลักชื่อ expense-tracker-app
- พอร์ตที่เปิดใช้งาน: host 3068 -> container 3000
- Build image จาก Dockerfile (multi-stage)
- Runtime env โหลดจาก .env + environment ใน docker-compose.yml

## 4) Prerequisites Checklist (ก่อน deploy)

- อยู่ที่ root ของโปรเจกต์
- มีไฟล์ .env อยู่ใน root
- ตรวจว่าคีย์สำคัญมีครบ:
  - DATABASE_URL
  - CLERK_SECRET_KEY
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - NEXT_PUBLIC_CLERK_SIGN_IN_URL
  - NEXT_PUBLIC_CLERK_SIGN_UP_URL
  - DISCORD_WEBHOOK_URL (deploy.sh ต้องใช้ ถ้าไม่ตั้งค่าสคริปต์จะหยุดทันที)
- Docker พร้อมใช้งาน:
  - docker compose version
- Git พร้อมใช้งาน:
  - git status
  - git remote -v
- ดิสก์เหลือเพียงพอ:
  - docker system df

## 5) Standard Deployment Procedure

1. เข้าสู่โฟลเดอร์โปรเจกต์
2. ตรวจสถานะ repository ว่าปลอดภัยสำหรับ pull
3. รันสคริปต์

คำสั่ง:

bash
./deploy.sh

ผลลัพธ์ที่คาดหวัง:

- มีแจ้งเตือนเริ่ม deploy ไป Discord
- ชื่อโปรเจกต์ในข้อความแจ้งเตือนตรงกับชื่อ repository ปัจจุบัน
- docker compose down สำเร็จ
- git pull origin main สำเร็จ
- docker compose build สำเร็จ
- docker compose up -d สำเร็จ
- prune สำเร็จ
- มีแจ้งเตือน Deployment Successful ไป Discord

## 6) Post-Deployment Verification

ตรวจทันทีหลัง deploy:

- docker compose ps
  - สถานะ service ต้องเป็น Up
- docker compose logs --tail=100
  - ไม่มี error ต่อเนื่อง
- เปิดหน้าแอปผ่าน URL production (พอร์ต 3068)
- ตรวจ endpoint สุขภาพระบบ:
  - /api/health/db ต้องตอบสำเร็จ

## 7) Incident Playbook (อาการพบบ่อย)

กรณี A: git pull ล้มเหลว

- สาเหตุที่พบบ่อย: มี local changes ค้างบนเซิร์ฟเวอร์
- แนวทาง:
  1) สำรองสถานะปัจจุบัน
  2) ทำให้ working tree สะอาด
  3) pull ใหม่

กรณี B: build ไม่ผ่าน

- เช็กค่าตัวแปรใน .env
- เช็ก package lock / dependency mismatch
- ดู log จาก docker compose build แบบละเอียด

กรณี C: container ขึ้นแต่เว็บเข้าไม่ได้

- เช็ก mapping พอร์ต 3068:3000
- เช็ก firewall หรือ reverse proxy ด้านหน้า
- เช็ก log แอป: docker compose logs --tail=200 expense-tracker-app

กรณี D: Health DB ไม่ผ่าน

- เช็ก DATABASE_URL
- เช็กการเข้าถึง DB จากเครื่องที่รันคอนเทนเนอร์
- ตรวจ policy/allowlist ฝั่งฐานข้อมูล

## 8) Rollback Procedure (ฉุกเฉิน)

แนวทาง rollback แบบเร็ว:

1. หา commit ก่อนหน้าที่เสถียร
2. checkout ไป commit นั้น
3. รัน deploy.sh ซ้ำ

คำสั่งตัวอย่าง:

bash
PREV_COMMIT=<commit_sha_ก่อนหน้า>
git checkout "$PREV_COMMIT"
./deploy.sh

หลัง rollback:

- ยืนยันว่า service เป็น Up
- ยืนยันว่า business flow สำคัญใช้งานได้
- เก็บหลักฐาน log และเวลาเกิดเหตุ

## 9) Operational Best Practices

- ห้ามแก้โค้ดตรงบน production โดยตรง
- ทุกการเปลี่ยนแปลงผ่าน branch/PR และ merge เข้า main
- ตั้งรอบ deploy ที่ชัดเจน (เช่น หลัง test ผ่าน)
- เก็บค่าลับ เช่น DISCORD_WEBHOOK_URL ไว้ใน .env หรือ secret manager เท่านั้น
- เก็บบันทึกเหตุการณ์ deploy ทุกครั้ง (เวลา, ผู้ deploy, commit, ผลลัพธ์)

## 10) Handover Checklist (สำหรับรุ่นน้อง)

- รัน local ได้ (npm install, npm run dev)
- เข้าใจตำแหน่งไฟล์สำคัญ:
  - deploy.sh
  - docker-compose.yml
  - Dockerfile
  - app/api/health/db/route.js
- ทำ dry-run ในสภาพแวดล้อมทดสอบได้
- ทำ rollback simulation อย่างน้อย 1 ครั้ง
- อ่าน log และระบุ root cause เบื้องต้นได้

## 11) Change Log Template (แนะนำให้ใช้)

ใช้เทมเพลตนี้ทุกครั้งหลัง deploy:

- Date/Time:
- Operator:
- Commit:
- Scope:
- Result:
- Verification:
- Incident/Note:
