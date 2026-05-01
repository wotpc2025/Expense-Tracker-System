#!/bin/bash

# สคริปต์นี้ใช้สำหรับ deploy แอปแบบอัตโนมัติบน Docker
# ลำดับการทำงานหลัก: แจ้งเริ่ม -> ปิดของเก่า -> ดึงโค้ด -> build -> up -> cleanup -> แจ้งสำเร็จ
#
# =============================== RUNBOOK (TH) ===============================
# วัตถุประสงค์:
# - ใช้ deploy เวอร์ชันล่าสุดจาก branch main ขึ้นสภาพแวดล้อม production
# - ทำงานแบบ fail-fast: ถ้าขั้นตอนไหนพังจะหยุดทันทีและส่งแจ้งเตือน Discord
#
# สำหรับผู้ดูแลระบบ/รุ่นน้อง (ก่อนรันทุกครั้ง):
# 1) ยืนยันว่าอยู่ที่ root ของ repository นี้
#    - ตรวจด้วย: pwd และ ls ต้องเห็น docker-compose.yml, Dockerfile, deploy.sh
# 2) ยืนยันว่ามีไฟล์ .env และค่าจำเป็นครบ
#    - อย่างน้อย: DATABASE_URL, CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
#    - ถ้าใช้แจ้งเตือน Discord ต้องมี DISCORD_WEBHOOK_URL
# 3) ยืนยันสิทธิ์ใช้งาน Docker/Git บนเครื่องปลายทาง
#    - docker compose version
#    - git remote -v
# 4) ตรวจว่าดิสก์ไม่ใกล้เต็มเกินไป
#    - docker system df
#
# ขั้นตอนตรวจหลัง deploy (Post-Deploy Verification):
# - docker compose ps                    # คอนเทนเนอร์ต้องเป็นสถานะ Up
# - docker compose logs --tail=100       # ดู error ล่าสุด
# - เปิดใช้งาน URL ของระบบที่พอร์ต production
# - เรียก health endpoint (ถ้ามี): /api/health/db
#
# กรณีฉุกเฉิน (Rollback แบบเร็ว):
# - ถ้า deploy พังหลัง git pull ให้ checkout commit เดิมแล้วรันสคริปต์ซ้ำ
#   ตัวอย่าง:
#   PREV_COMMIT=<commit_sha_ก่อนหน้า>
#   git checkout "$PREV_COMMIT"
#   ./deploy.sh
# - เมื่อบริการกลับมาแล้วค่อยวิเคราะห์สาเหตุจาก logs และ commit diff
# ==========================================================================

# Automated deployment script for a Dockerized Next.js app.
# Flow: notify start -> down -> git pull -> build -> up -> prune -> notify success.
#
# Operational assumptions:
# - Script runs from repository root on target host.
# - `docker compose` and `git` are installed and authenticated.
# - Required runtime secrets exist in `.env` for compose.

# --- Configuration Section ---
# Replace with your actual Discord Webhook URL
# URL สำหรับส่งแจ้งเตือนไป Discord (อ่านจากตัวแปรแวดล้อม)
# ถ้าไม่ตั้งค่า DISCORD_WEBHOOK_URL คำสั่ง curl จะล้มเหลวและสคริปต์หยุดตาม set -e
DISCORD_WEBHOOK=$DISCORD_WEBHOOK_URL
# Define your project name for identification in Discord notifications
# ชื่อโปรเจกต์ที่จะแสดงในข้อความแจ้งเตือน
PROJECT_NAME="Expense-Tracker-App" 
# -----------------------------

# Exit immediately if any command exits with a non-zero status (error)
# ถ้าคำสั่งใดล้มเหลว ให้หยุดสคริปต์ทันที
# เหมาะกับงาน production เพราะไม่ปล่อยให้ขั้นตอนถัดไปทำงานบนสถานะที่ผิดพลาด
set -e

# Optional: enable trace logs by uncommenting the next line when debugging.
# set -x

# Function to send embedded messages to Discord using a Webhook
# Parameters: $1 = Decimal Color, $2 = Title, $3 = Description
# ฟังก์ชันส่งข้อความแบบ embed ไป Discord
# พารามิเตอร์: $1 = สี (เลขฐานสิบ), $2 = หัวข้อ, $3 = รายละเอียด
# หมายเหตุ: ใช้ JSON แบบ inline string เพื่อให้ใช้งานง่ายใน bash script เดียว
send_discord_msg() {
    local color="$1"
    local title="$2"
    local desc="$3"
    
    curl -H "Content-Type: application/json" \
         -X POST \
         -d '{
            "embeds": [{
                "title": "'"$title"'",
                "description": "'"$desc"'",
                "color": '"$color"'
            }]
         }' "$DISCORD_WEBHOOK"
}

# Error Handling: Execute this trap if any command fails (ERR signal)
# ถ้าเกิดข้อผิดพลาดระหว่างทาง จะส่งข้อความแจ้งล้มเหลวทันที
# ช่วยให้ผู้ดูแลเห็นเหตุการณ์ผิดปกติได้เร็ว แม้ไม่ได้เปิด terminal ค้างไว้
trap 'send_discord_msg 16711680 "❌ Deployment Failed!" "Project: '"$PROJECT_NAME"'\nStep: An error occurred during deployment. Check Proxmox logs for details."' ERR

# Notification: Notify Discord that the deployment has started
# แจ้งสถานะเริ่ม deploy
echo "🚀 Starting Deployment Process..."
send_discord_msg 3447003 "⏳ Deployment Started" "Starting update for '"$PROJECT_NAME"' on Proxmox..."

# Step 1: Stop and remove existing containers and networks defined in compose.
# ขั้นตอน 1: หยุดและลบคอนเทนเนอร์/เน็ตเวิร์กเดิมเพื่อเตรียมเริ่มใหม่แบบสะอาด
# เหตุผลเชิง operation: ลดความเสี่ยงจาก state เก่าค้าง (เช่น network/volume binding เพี้ยน)
echo "🛑 Step 1: Stopping current containers..."
docker compose down

# Step 2: Fetch latest source code.
# ขั้นตอน 2: ดึงโค้ดล่าสุดจากสาขา main
echo "📥 Step 2: Pulling latest code..."
# If local changes exist on server, this command can fail and trigger ERR trap.
# หากเซิร์ฟเวอร์มีการแก้ไฟล์ค้างไว้ git pull อาจล้มเหลวและเข้า trap ERR
# แนวปฏิบัติทีม: ไม่แก้โค้ดตรงบนเครื่อง production เพื่อลด merge conflict ตอน deploy
git pull origin main

# Step 3: Build/rebuild service images from current source.
# ขั้นตอน 3: สร้าง image ใหม่จากซอร์สปัจจุบัน
echo "🏗️  Step 3: Building Docker images..."
# Build uses docker-compose.yml and Dockerfile from current working tree.
# ใช้ค่าการ build จาก docker-compose.yml และ Dockerfile ในโฟลเดอร์นี้
# ถ้า build fail ให้เช็ก .env, build args, และ dependency/version mismatch
docker compose build

# Step 4: Start containers in detached mode.
# ขั้นตอน 4: สตาร์ตคอนเทนเนอร์แบบรันเบื้องหลัง
# เมื่อ up สำเร็จ ให้ตรวจ docker compose ps และ log ทันทีในรอบแรก
echo "🚢 Step 4: Starting new containers..."
docker compose up -d

# Step 5: Cleanup old images/build cache to keep disk usage under control.
# ขั้นตอน 5: ล้างข้อมูลที่ไม่ใช้เพื่อลดการกินพื้นที่ดิสก์
echo "🧹 Step 5: Cleaning up unused Docker data..."
# `image prune` removes dangling images; `builder prune` removes old build cache.
# image prune ลบ image ที่ไม่ได้อ้างอิงแล้ว, builder prune ลบ cache การ build เก่า
# หมายเหตุ: การ prune ช่วยลดดิสก์เต็ม แต่ไม่ลบ image ที่ยังถูกใช้งานอยู่
docker image prune -f
docker builder prune -f --filter "until=24h"

# Step 6: Final success notification
# ขั้นตอน 6: แจ้งผลสำเร็จเมื่อทุกอย่างทำงานเรียบร้อย
# ปิดงานรอบ deploy: ทีมสามารถเทียบเวลาสำเร็จกับ monitoring/alert ได้จากข้อความนี้
echo "🎉 Deployment Completed!"
send_discord_msg 65280 "✅ Deployment Successful!" "Project: '"$PROJECT_NAME"'\nStatus: Everything is up and running successfully on Proxmox lxc container!"